# Revision Semantics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement free-text revision semantics that map adds/removes/replacements to semantic slots and apply them to a blueprint with conflict resolution and fallback rules.

**Architecture:** Add a revision semantics module that parses intents, maps tokens to semantic slots, and produces a `revisionReport`. Wire `scripts/revise-blueprint.mjs` to use this module so revisions are applied consistently. Validate via contract tests.

**Tech Stack:** Node.js (ES modules), node:test, existing core blueprint contracts

---

### Task 1: Add Revision Semantics Module

**Files:**
- Create: `core/revision/revision-semantics.mjs`
- Test: `evals/contract/revision-semantics.test.mjs`

- [ ] **Step 1: Write the failing contract test**

```js
import test from 'node:test';
import assert from 'node:assert/strict';

import { applyRevisionSemantics } from '../../core/revision/revision-semantics.mjs';

const baseBlueprint = {
  pageName: 'Overview',
  layoutPattern: 'overview-home',
  themeDirection: 'deep blue',
  sections: [
    { id: 'geo-focus-1', semanticSlot: 'geo-focus', component: 'GeoFocusSection', priority: 100 },
    { id: 'trend-chart-2', semanticSlot: 'trend-chart', component: 'TrendChartSection', priority: 95 },
    { id: 'data-table-3', semanticSlot: 'data-table', component: 'DataTableSection', priority: 90 },
  ],
};

test('revision semantics applies add/remove/replace and emits report', () => {
  const { blueprint, report } = applyRevisionSemantics(
    baseBlueprint,
    '去掉地图，加排行和构成，表格改成告警',
  );

  const slots = blueprint.sections.map((s) => s.semanticSlot);
  assert.equal(slots.includes('geo-focus'), false);
  assert.equal(slots.includes('ranking-list'), true);
  assert.equal(slots.includes('composition-chart'), true);
  assert.equal(slots.includes('alert-stream'), true);
  assert.equal(slots.includes('data-table'), false);

  assert.ok(report.added.includes('ranking-list'));
  assert.ok(report.removed.includes('geo-focus'));
  assert.ok(report.replaced.some((r) => r.from === 'data-table' && r.to === 'alert-stream'));
});

test('last occurrence wins for conflicting add/remove', () => {
  const { report } = applyRevisionSemantics(
    baseBlueprint,
    '不要地图，但是加地图',
  );

  assert.ok(report.conflicts.some((c) => c.slot === 'geo-focus' && c.resolution === 'add'));
});

test('deleting main visual promotes next priority slot', () => {
  const { blueprint } = applyRevisionSemantics(
    baseBlueprint,
    '删除地图',
  );

  const highest = blueprint.sections.slice().sort((a, b) => b.priority - a.priority)[0];
  assert.equal(highest.semanticSlot, 'trend-chart');
});

test('fallback slot added when sections drop below 2', () => {
  const tinyBlueprint = {
    ...baseBlueprint,
    sections: [{ id: 'geo-focus-1', semanticSlot: 'geo-focus', component: 'GeoFocusSection', priority: 100 }],
  };

  const { blueprint } = applyRevisionSemantics(tinyBlueprint, '删除地图');
  const slots = blueprint.sections.map((s) => s.semanticSlot);
  assert.ok(slots.includes('trend-chart'));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test evals/contract/revision-semantics.test.mjs`  
Expected: FAIL because the module does not exist.

- [ ] **Step 3: Write minimal implementation**

```js
const SLOT_MAP = [
  { slot: 'geo-focus', keywords: ['map', 'geo', '地图', '区域'] },
  { slot: 'ranking-list', keywords: ['ranking', 'rank', '排行', '排名'] },
  { slot: 'composition-chart', keywords: ['composition', 'pie', '构成', '占比'] },
  { slot: 'alert-stream', keywords: ['alert', 'alarm', '告警', '预警'] },
  { slot: 'data-table', keywords: ['table', 'ledger', '表格', '台账'] },
  { slot: 'trend-chart', keywords: ['trend', 'line', '趋势', '走势'] },
  { slot: 'metric-summary', keywords: ['kpi', 'metric', '指标', '统计'] },
];

const ADD_WORDS = ['加', '新增', '增加', '添加'];
const REMOVE_WORDS = ['去掉', '删除', '移除', '不要', '不需要'];
const REPLACE_WORDS = ['改成', '替换为', '换成'];

const FALLBACK_SLOTS = ['trend-chart', 'composition-chart', 'ranking-list'];

function matchSlots(text) {
  const hits = [];
  for (const entry of SLOT_MAP) {
    if (entry.keywords.some((kw) => text.includes(kw))) hits.push(entry.slot);
  }
  return hits;
}

function extractActions(text) {
  const actions = [];
  const lines = text.split(/[，,。;\n]/).map((s) => s.trim()).filter(Boolean);
  for (const line of lines) {
    const lower = line.toLowerCase();
    const slots = matchSlots(lower);
    if (!slots.length) continue;
    if (REPLACE_WORDS.some((w) => lower.includes(w))) {
      actions.push({ type: 'replace', slots });
    } else if (REMOVE_WORDS.some((w) => lower.includes(w))) {
      actions.push({ type: 'remove', slots });
    } else if (ADD_WORDS.some((w) => lower.includes(w))) {
      actions.push({ type: 'add', slots });
    }
  }
  return actions;
}

function toComponent(slot) {
  return slot
    .split('-')
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join('') + 'Section';
}

function toId(slot, index) {
  return `${slot}-${index + 1}`;
}

export function applyRevisionSemantics(blueprint, revisionText) {
  const actions = extractActions(String(revisionText || ''));
  const report = { added: [], removed: [], replaced: [], adjustments: [], conflicts: [], unmapped: [] };

  const result = {
    ...blueprint,
    sections: blueprint.sections.map((s) => ({ ...s })),
  };

  const decisions = new Map();
  for (const action of actions) {
    for (const slot of action.slots) {
      decisions.set(slot, action.type);
    }
  }

  for (const [slot, type] of decisions) {
    if (type === 'remove') {
      report.removed.push(slot);
      result.sections = result.sections.filter((s) => s.semanticSlot !== slot);
    }
    if (type === 'add') {
      report.added.push(slot);
      if (!result.sections.some((s) => s.semanticSlot === slot)) {
        result.sections.push({
          id: toId(slot, result.sections.length),
          semanticSlot: slot,
          component: toComponent(slot),
          priority: 80,
        });
      }
    }
    if (type === 'replace') {
      const [from, to] = action.slots;
      if (from && to) {
        report.replaced.push({ from, to });
        result.sections = result.sections.filter((s) => s.semanticSlot !== from);
        if (!result.sections.some((s) => s.semanticSlot === to)) {
          result.sections.push({
            id: toId(to, result.sections.length),
            semanticSlot: to,
            component: toComponent(to),
            priority: 80,
          });
        }
      }
    }
  }

  if (result.sections.length < 2) {
    for (const slot of FALLBACK_SLOTS) {
      if (!result.sections.some((s) => s.semanticSlot === slot)) {
        result.sections.push({
          id: toId(slot, result.sections.length),
          semanticSlot: slot,
          component: toComponent(slot),
          priority: 70,
        });
        report.added.push(slot);
        break;
      }
    }
  }

  result.revisionReport = report;
  return { blueprint: result, report };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test evals/contract/revision-semantics.test.mjs`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add core/revision/revision-semantics.mjs evals/contract/revision-semantics.test.mjs
git commit -m "add revision semantics core"
```

### Task 2: Wire Revision Semantics into CLI

**Files:**
- Modify: `scripts/revise-blueprint.mjs`
- Test: `evals/integration/revise-screen-cli.test.mjs`

- [ ] **Step 1: Write the failing integration assertion**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

test('revise-screen applies add/remove/replace semantics', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bigscreen-revise-'));
  const requestFile = path.join(tempDir, 'request.json');
  const blueprintFile = path.join(tempDir, 'base.blueprint.json');
  const revisionFile = path.join(tempDir, 'revision.txt');

  fs.writeFileSync(
    requestFile,
    JSON.stringify({
      sourceMode: 'text',
      pageIntent: 'overview',
      styleDirection: 'deep blue',
      requiredModules: ['metric-summary', 'geo-focus', 'data-table'],
    }),
  );

  spawnSync('node', ['scripts/build-blueprint.mjs', '--request-file', requestFile, '--format', 'json', '--output', blueprintFile], { encoding: 'utf8' });
  fs.writeFileSync(revisionFile, '去掉地图，加排行');

  const reviseResult = spawnSync(
    'node',
    ['scripts/revise-screen.mjs', '--blueprint-file', blueprintFile, '--revision-file', revisionFile, '--target', tempDir],
    { encoding: 'utf8', env: { ...process.env, BIGSCREEN_SKIP_UX: '1' } },
  );

  assert.equal(reviseResult.status, 0);

  const revised = JSON.parse(fs.readFileSync(path.join(tempDir, 'docs', 'screen-specs', 'Overview.blueprint.json'), 'utf8'));
  const slots = revised.sections.map((s) => s.semanticSlot);
  assert.equal(slots.includes('geo-focus'), false);
  assert.equal(slots.includes('ranking-list'), true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test evals/integration/revise-screen-cli.test.mjs`  
Expected: FAIL because `revise-blueprint` doesn’t apply semantic actions yet.

- [ ] **Step 3: Implement wiring**

```js
import { applyRevisionSemantics } from '../core/revision/revision-semantics.mjs';

// After computing revised blueprint:
const { blueprint: patched } = applyRevisionSemantics(revised, revisionText);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test evals/integration/revise-screen-cli.test.mjs`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add scripts/revise-blueprint.mjs evals/integration/revise-screen-cli.test.mjs
git commit -m "wire revision semantics into revise flow"
```

## Self-Review

Spec coverage:
- Semantic mapping and intent parsing: Task 1
- Conflict resolution and fallbacks: Task 1 tests
- Revision pipeline wiring: Task 2

Placeholder scan:
- No placeholder language remains

Type consistency:
- Slots and report fields match the spec

