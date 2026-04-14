const SLOT_PATTERNS = [
  { slot: 'geo-focus', keywords: ['地图', 'map', 'geo', '区域'] },
  { slot: 'ranking-list', keywords: ['排行', '排名', 'ranking', 'rank'] },
  { slot: 'composition-chart', keywords: ['构成', '占比', 'composition', 'pie'] },
  { slot: 'alert-stream', keywords: ['告警', '预警', 'alert', 'alarm'] },
  { slot: 'data-table', keywords: ['表格', '台账', 'table', 'ledger'] },
  { slot: 'trend-chart', keywords: ['趋势', '走势', 'trend', 'line'] },
  { slot: 'metric-summary', keywords: ['指标', '统计', 'kpi', 'metric'] },
];

const FALLBACK_SLOTS = ['trend-chart', 'composition-chart', 'ranking-list'];

const ADD_WORDS = ['加', '新增', '增加', '添加', 'add', 'include', 'plus'];
const REMOVE_WORDS = ['去掉', '删除', '移除', '不要', '不需要', '去除', 'remove', 'delete', 'drop'];
const REPLACE_WORDS = ['改成', '替换为', '换成', 'replace'];

function cloneBlueprint(blueprint) {
  return {
    ...blueprint,
    sections: Array.isArray(blueprint?.sections) ? blueprint.sections.map((section) => ({ ...section })) : [],
  };
}

function toComponentName(slot) {
  return `${slot
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')}Section`;
}

function toSectionId(slot, sections) {
  const count = sections.filter((section) => section.semanticSlot === slot).length;
  return `${slot}-${count + 1}`;
}

function findSlotHits(text) {
  const hits = [];
  const source = String(text ?? '').toLowerCase();
  for (const entry of SLOT_PATTERNS) {
    if (entry.keywords.some((keyword) => source.includes(keyword))) {
      hits.push(entry.slot);
    }
  }
  return hits;
}

function parseReplaceSlots(clause) {
  for (const word of REPLACE_WORDS) {
    const index = clause.indexOf(word);
    if (index < 0) continue;

    const before = clause.slice(0, index);
    const after = clause.slice(index + word.length);
    const from = findSlotHits(before);
    const to = findSlotHits(after);

    if (from.length && to.length) {
      return [from[0], to[0]];
    }
  }

  const slots = findSlotHits(clause);
  return slots.length >= 2 ? [slots[0], slots[1]] : slots;
}

function inferActions(revisionText) {
  const actions = [];
  const unmapped = [];
  const clauses = String(revisionText ?? '')
    .split(/[，,。；;\n]/)
    .map((part) => part.trim())
    .filter(Boolean);

  for (const clause of clauses) {
    const lower = clause.toLowerCase();
    const slots = findSlotHits(clause).filter((slot, index, array) => array.indexOf(slot) === index);
    if (!slots.length) {
      unmapped.push(clause);
      continue;
    }

    if (REPLACE_WORDS.some((word) => lower.includes(word))) {
      const replaceSlots = parseReplaceSlots(clause);
      if (replaceSlots.length >= 2) {
        actions.push({ type: 'replace', slots: replaceSlots });
      }
      continue;
    }

    if (REMOVE_WORDS.some((word) => lower.includes(word))) {
      actions.push({ type: 'remove', slots });
      continue;
    }

    if (ADD_WORDS.some((word) => lower.includes(word))) {
      actions.push({ type: 'add', slots });
    }
  }

  return { actions, unmapped };
}

function upsertSection(sections, slot, priority) {
  if (sections.some((section) => section.semanticSlot === slot)) return sections;
  sections.push({
    id: toSectionId(slot, sections),
    semanticSlot: slot,
    component: toComponentName(slot),
    priority,
  });
  return sections;
}

function removeSection(sections, slot) {
  return sections.filter((section) => section.semanticSlot !== slot);
}

function promoteNextHighestPriority(sections, removedPriority, report, removedSlot) {
  if (!sections.length) return sections;

  const promoted = sections.reduce((best, section) => {
    if (!best) return section;
    const bestPriority = best.priority ?? 0;
    const currentPriority = section.priority ?? 0;
    return currentPriority > bestPriority ? section : best;
  }, null);

  const promotedPriority = (removedPriority ?? 0) + 1;
  const previousPriority = promoted.priority ?? 0;
  promoted.priority = promotedPriority;
  report.adjustments.push({
    type: 'promote-main-visual',
    from: removedSlot,
    slot: promoted.semanticSlot,
    fromPriority: previousPriority,
    toPriority: promotedPriority,
  });

  return sections;
}

function addMissingFallback(sections, report, removedSlots = new Set(), priorityOverride = null) {
  for (const slot of FALLBACK_SLOTS) {
    if (removedSlots.has(slot)) continue;
    if (!sections.some((section) => section.semanticSlot === slot)) {
      report.added.push(slot);
      return upsertSection(sections, slot, priorityOverride ?? 80);
    }
  }

  return sections;
}

export function applyRevisionSemantics(blueprint, revisionText) {
  const nextBlueprint = cloneBlueprint(blueprint);
  const report = {
    added: [],
    removed: [],
    replaced: [],
    adjustments: [],
    conflicts: [],
    unmapped: [],
  };

  const { actions, unmapped } = inferActions(revisionText);
  report.unmapped.push(...unmapped);
  const decisionSequence = [];
  const replacePairs = [];

  for (const action of actions) {
    if (action.type === 'replace' && action.slots.length >= 2) {
      const [from, to] = action.slots;
      decisionSequence.push({ type: 'remove', slot: from, replacement: to });
      decisionSequence.push({ type: 'add', slot: to, replacementFrom: from });
      replacePairs.push({ from, to });
      continue;
    }

    for (const slot of action.slots) {
      decisionSequence.push({ type: action.type, slot });
    }
  }

  let sections = nextBlueprint.sections;
  const originalPriorities = new Map(sections.map((section) => [section.semanticSlot, section.priority ?? 0]));
  const latestDecisionBySlot = new Map();

  for (const decision of decisionSequence) {
    const previous = latestDecisionBySlot.get(decision.slot);
    if (previous && previous.type !== decision.type) {
      report.conflicts.push({ slot: decision.slot, resolution: decision.type, previous: previous.type });
    }
    latestDecisionBySlot.set(decision.slot, decision);
  }

  const mainVisual = sections.reduce((best, section) => {
    if (!best) return section;
    return (section.priority ?? 0) > (best.priority ?? 0) ? section : best;
  }, null);

  const finalDecisions = [...latestDecisionBySlot.values()];
  const removedSlots = new Set();
  const addedSlots = new Set();

  for (const decision of finalDecisions) {
    if (decision.type !== 'remove') continue;
    if (sections.some((section) => section.semanticSlot === decision.slot)) {
      sections = removeSection(sections, decision.slot);
      report.removed.push(decision.slot);
      removedSlots.add(decision.slot);
    }
  }

  for (const decision of finalDecisions) {
    if (decision.type !== 'add') continue;
    if (!sections.some((section) => section.semanticSlot === decision.slot)) {
      sections = upsertSection(sections, decision.slot, originalPriorities.get(decision.slot) ?? 80);
      report.added.push(decision.slot);
      addedSlots.add(decision.slot);
    }
  }

  for (const pair of replacePairs) {
    if (removedSlots.has(pair.from) && addedSlots.has(pair.to)) {
      report.replaced.push(pair);
    }
  }

  const removedMainVisual =
    mainVisual && latestDecisionBySlot.get(mainVisual.semanticSlot)?.type === 'remove';
  const replacementForMain = removedMainVisual
    ? replacePairs.find((pair) => pair.from === mainVisual.semanticSlot)?.to
    : null;
  const removedPriority = mainVisual?.priority ?? 0;
  if (removedMainVisual && replacementForMain && sections.some((s) => s.semanticSlot === replacementForMain)) {
    const promoted = sections.find((s) => s.semanticSlot === replacementForMain);
    const previousPriority = promoted.priority ?? 0;
    promoted.priority = removedPriority + 1;
    report.adjustments.push({
      type: 'promote-main-visual',
      from: mainVisual?.semanticSlot ?? null,
      slot: promoted.semanticSlot,
      fromPriority: previousPriority,
      toPriority: removedPriority + 1,
    });
  } else if (removedMainVisual && sections.length) {
    sections = promoteNextHighestPriority(sections, removedPriority, report, mainVisual.semanticSlot);
  }

  if (sections.length < 2 && report.removed.length > 0) {
    const promoteFallback = removedMainVisual && !sections.length;
    const override = promoteFallback ? removedPriority + 1 : null;
    sections = addMissingFallback(sections, report, new Set(report.removed), override);
    if (promoteFallback) {
      const promotedSlot = report.added[report.added.length - 1];
      if (promotedSlot) {
        report.adjustments.push({
          type: 'promote-main-visual',
          from: mainVisual?.semanticSlot ?? null,
          slot: promotedSlot,
          fromPriority: removedPriority,
          toPriority: removedPriority + 1,
        });
      }
    }
  }

  nextBlueprint.sections = sections;
  nextBlueprint.revisionReport = report;

  return {
    blueprint: nextBlueprint,
    report,
  };
}
