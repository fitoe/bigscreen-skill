#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractMapTargetHint } from './datav-geojson.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const sectionComponentMap = [
  { match: ['kpi', 'summary', 'metrics', 'stats'], component: 'StatCard', area: 'top' },
  { match: ['map', 'geo', 'region'], component: 'MapPanel', area: 'center' },
  { match: ['trend', 'line', 'timeline'], component: 'LineTrendChart', area: 'left' },
  { match: ['compare', 'bar', 'category'], component: 'BarCompareChart', area: 'right' },
  { match: ['composition', 'ratio', 'pie'], component: 'PieRingChart', area: 'right' },
  { match: ['ranking', 'rank'], component: 'RankingList', area: 'side' },
  { match: ['alert', 'alarm', 'event'], component: 'AlarmTicker', area: 'bottom' },
  { match: ['table', 'list', 'ledger'], component: 'ScrollTable', area: 'bottom' },
];

const defaultSectionsByPageType = {
  'overview-home': ['kpi', 'trend', 'map', 'composition', 'ranking', 'alerts', 'table'],
  'monitoring-analysis': ['kpi', 'trend', 'compare', 'composition', 'ranking', 'table'],
  'alarm-center': ['kpi', 'alerts', 'composition', 'ranking', 'table'],
  'thematic-cockpit': ['kpi', 'trend', 'compare', 'composition', 'table'],
  'map-command-page': ['kpi', 'map', 'trend', 'compare', 'ranking', 'alerts', 'table'],
};

const complexityByPurpose = {
  map: 5,
  trend: 4,
  alerts: 4,
  table: 4,
  compare: 3,
  composition: 2,
  ranking: 2,
  kpi: 1,
};

const promptLabelMap = {
  domain: ['theme', '主题', 'domain', '行业', '场景'],
  pageType: ['page type', '页面类型', 'page', '页面'],
  keyMetrics: ['key metrics', '关键指标', '核心指标'],
  preferredStyle: ['style', '风格'],
  mustHaveSections: ['must modules', 'must-have sections', '必须模块', '模块'],
  dataDensity: ['data density', '数据密度'],
  audience: ['audience', '对象'],
  refreshExpectation: ['refresh', '刷新频率'],
};

const sectionAliases = new Map([
  ['kpi', 'kpi'],
  ['指标', 'kpi'],
  ['summary', 'kpi'],
  ['metrics', 'kpi'],
  ['stats', 'kpi'],
  ['趋势', 'trend'],
  ['trend', 'trend'],
  ['line', 'trend'],
  ['地图', 'map'],
  ['map', 'map'],
  ['geo', 'map'],
  ['排行', 'ranking'],
  ['排名', 'ranking'],
  ['ranking', 'ranking'],
  ['rank', 'ranking'],
  ['告警', 'alerts'],
  ['预警', 'alerts'],
  ['alerts', 'alerts'],
  ['alert', 'alerts'],
  ['alarm', 'alerts'],
  ['事件', 'alerts'],
  ['表格', 'table'],
  ['表单', 'table'],
  ['table', 'table'],
  ['list', 'table'],
  ['ledger', 'table'],
  ['对比', 'compare'],
  ['compare', 'compare'],
  ['bar', 'compare'],
  ['占比', 'composition'],
  ['构成', 'composition'],
  ['composition', 'composition'],
  ['pie', 'composition'],
]);

const genericNameMap = [
  { pattern: /设备|device/i, singular: 'Device', plural: 'Devices' },
  { pattern: /用户|user|member|account/i, singular: 'User', plural: 'Users' },
  { pattern: /订单|order|工单|ticket/i, singular: 'Work Order', plural: 'Work Orders' },
  { pattern: /车辆|vehicle|car/i, singular: 'Vehicle', plural: 'Vehicles' },
  { pattern: /任务|task|job/i, singular: 'Task', plural: 'Tasks' },
  { pattern: /资源|resource|asset/i, singular: 'Asset', plural: 'Assets' },
  { pattern: /项目|project/i, singular: 'Project', plural: 'Projects' },
  { pattern: /站点|site|station/i, singular: 'Site', plural: 'Sites' },
  { pattern: /产线|line|batch/i, singular: 'Line', plural: 'Lines' },
];

const genericStateSets = {
  default: ['Healthy', 'Warning', 'Critical'],
  process: ['Stable', 'Queued', 'Delayed'],
  service: ['Online', 'Busy', 'Offline'],
};

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i += 1) {
    const part = argv[i];
    if (part.startsWith('--')) {
      args[part.slice(2)] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
    }
  }
  return args;
}

function normalizeArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return String(value)
    .split(/[,，、/]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function firstNonEmpty(values) {
  return values.find((value) => String(value || '').trim()) || '';
}

function normalizeDensity(value) {
  const text = String(value || '').trim().toLowerCase();
  if (['高', 'high'].includes(text)) return 'high';
  if (['低', 'low'].includes(text)) return 'low';
  return 'medium';
}

function canonicalizeSectionToken(value) {
  const raw = String(value || '').trim();
  if (!raw) return raw;
  const lower = raw.toLowerCase();
  for (const [token, canonical] of sectionAliases.entries()) {
    if (raw.includes(token) || lower.includes(token)) return canonical;
  }
  return lower;
}

function detectPageTypeFromPrompt(text) {
  const source = String(text);
  if (/首页|home page|home\b|overview/i.test(source)) return 'overview-home';
  if (/地图|map/.test(source) && /command|指挥/.test(source)) return 'map-command-page';
  if (/告警|alert|alarm/.test(source) && /中心|center/.test(source)) return 'alarm-center';
  if (/monitor|analysis|分析|监测/.test(source)) return 'monitoring-analysis';
  if (/专题|thematic/.test(source)) return 'thematic-cockpit';
  return 'overview-home';
}

function normalizePageType(value, fallbackSource = '') {
  const text = String(value || '').trim();
  if (!text) return detectPageTypeFromPrompt(fallbackSource);
  if (['overview-home', 'monitoring-analysis', 'alarm-center', 'thematic-cockpit', 'map-command-page'].includes(text)) {
    return text;
  }
  return detectPageTypeFromPrompt(text || fallbackSource);
}

function extractPromptValue(text, keys) {
  const lines = String(text).split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    for (const key of keys) {
      const pattern = new RegExp(`^${key}\\s*[:：]\\s*(.+)$`, 'i');
      const match = trimmed.match(pattern);
      if (match) return match[1].trim();
    }
  }
  return '';
}

function parsePromptInput(raw) {
  const text = String(raw).trim();
  const mustHaveSections = normalizeArray(extractPromptValue(text, promptLabelMap.mustHaveSections));
  const keyMetrics = normalizeArray(extractPromptValue(text, promptLabelMap.keyMetrics));
  const pageType = normalizePageType(extractPromptValue(text, promptLabelMap.pageType), text);
  const domain = extractPromptValue(text, promptLabelMap.domain) || 'general';
  const preferredStyle = extractPromptValue(text, promptLabelMap.preferredStyle) || 'deep blue glow';
  const densityValue = extractPromptValue(text, promptLabelMap.dataDensity);
  const audience = extractPromptValue(text, promptLabelMap.audience) || 'operations';
  const refreshExpectation = extractPromptValue(text, promptLabelMap.refreshExpectation) || 'realtime';
  const normalizedSections = mustHaveSections.map((section) => canonicalizeSectionToken(section));

  return {
    domain,
    pageType,
    audience,
    mustHaveSections: normalizedSections.length ? normalizedSections : mustHaveSections,
    keyMetrics,
    preferredStyle,
    dataDensity: normalizeDensity(densityValue),
    mapRequired: normalizedSections.includes('map') || /地图|map|geo/i.test(text),
    mapTarget: extractMapTargetHint(text),
    refreshExpectation,
    originalPrompt: text,
  };
}

export function parseRequestInput(raw) {
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return parsePromptInput('{}');
    try {
      return parseRequestInput(JSON.parse(trimmed));
    } catch {
      return parsePromptInput(trimmed);
    }
  }

  const parsed = raw;
  return {
    domain: parsed.domain || 'general',
    pageType: normalizePageType(parsed.pageType, JSON.stringify(parsed)),
    audience: parsed.audience || 'operations',
    mustHaveSections: normalizeArray(parsed.mustHaveSections).map((item) => canonicalizeSectionToken(item)),
    keyMetrics: normalizeArray(parsed.keyMetrics),
    preferredStyle: parsed.preferredStyle || 'deep blue glow',
    dataDensity: normalizeDensity(parsed.dataDensity || 'medium'),
    mapRequired: Boolean(parsed.mapRequired) || normalizeArray(parsed.mustHaveSections).some((item) => canonicalizeSectionToken(item) === 'map'),
    mapTarget: parsed.mapTarget || extractMapTargetHint(parsed),
    refreshExpectation: parsed.refreshExpectation || 'realtime',
    originalPrompt: parsed.originalPrompt || '',
  };
}

function loadTemplateFeatures(templateFeaturesPath) {
  const text = fs.readFileSync(templateFeaturesPath, 'utf8').replace(/^\uFEFF/, '');
  return JSON.parse(text);
}

function inferSections(request) {
  const fromRequest = request.mustHaveSections.length ? request.mustHaveSections : defaultSectionsByPageType[request.pageType] || defaultSectionsByPageType['overview-home'];
  const result = [...fromRequest];
  if (request.mapRequired && !result.some((item) => /map|geo|region/.test(item))) result.unshift('map');
  if (request.keyMetrics.length && !result.some((item) => /kpi|summary|metrics|stats/.test(item))) result.unshift('kpi');
  return [...new Set(result)];
}

function componentForSection(sectionName) {
  const lower = canonicalizeSectionToken(sectionName);
  for (const entry of sectionComponentMap) {
    if (entry.match.some((token) => lower.includes(token))) {
      return {
        component: entry.component,
        area: entry.area,
      };
    }
  }
  return {
    component: 'PanelCard',
    area: 'main',
  };
}

function scoreTemplate(template, request, desiredSections) {
  let score = 0;
  if (template.sceneTags.includes(request.domain)) score += 6;
  if (template.pageTypes.includes(request.pageType)) score += 5;
  if (request.mapRequired && template.features.hasMap) score += 3;
  if (request.dataDensity === 'high' && template.fileCount >= 8) score += 2;
  if (/command|作战|指挥|alert/i.test(request.preferredStyle) && template.sceneTags.includes('security')) score += 2;
  if (/traffic|transport/i.test(request.domain) && template.sceneTags.includes('traffic')) score += 3;

  for (const section of desiredSections) {
    if (/map|geo/.test(section) && template.features.hasMap) score += 2;
    if (/alert|alarm|event/.test(section) && template.features.hasAlarm) score += 2;
    if (/table|list/.test(section) && template.features.hasTable) score += 1;
    if (/trend|line/.test(section) && template.chartFamilies.includes('line')) score += 1;
    if (/compare|bar|ranking/.test(section) && template.chartFamilies.includes('bar')) score += 1;
    if (/composition|pie|ratio/.test(section) && template.chartFamilies.includes('pie')) score += 1;
  }

  return score;
}

function buildThemeDirection(request, references) {
  if (request.preferredStyle) return request.preferredStyle;
  const tones = references.map((item) => item.tone);
  if (tones.includes('dark-alert')) return 'dark alert command center';
  if (tones.includes('cyan-industrial')) return 'cyan industrial';
  return 'deep blue glow';
}

function buildDataContract(sectionName, request) {
  const normalized = canonicalizeSectionToken(sectionName);
  if (/kpi|summary|metrics|stats/.test(normalized)) return { type: 'metric-list', keys: request.keyMetrics };
  if (/map|geo/.test(normalized)) return { type: 'map-payload', keys: ['regions', 'points', ...request.keyMetrics] };
  if (/alert|alarm|event/.test(normalized)) return { type: 'event-stream', keys: ['time', 'level', 'message'] };
  if (/table|list/.test(normalized)) return { type: 'row-list', keys: ['id', 'name', 'status', 'value'] };
  return { type: 'chart-series', keys: ['categories', 'series'] };
}

function inferEntityNames(request) {
  const source = firstNonEmpty([request.keyMetrics[0], request.domain, request.originalPrompt]);
  for (const entry of genericNameMap) {
    if (entry.pattern.test(source)) return entry;
  }
  return { singular: 'Asset', plural: 'Assets' };
}

function inferStateSet(request) {
  const text = `${request.domain} ${request.originalPrompt}`.toLowerCase();
  if (/流程|工单|任务|order|task|process/.test(text)) return genericStateSets.process;
  if (/服务|在线|user|service/.test(text)) return genericStateSets.service;
  return genericStateSets.default;
}

function inferSemanticProfile(request, sections) {
  const entity = inferEntityNames(request);
  const metrics = request.keyMetrics.length
    ? request.keyMetrics
    : [`Active ${entity.plural}`, 'Alerts', 'Load', 'Completion Rate'];
  const hasMap = sections.some((section) => section.purpose === 'map');
  const hasTable = sections.some((section) => section.purpose === 'table');
  const hasAlerts = sections.some((section) => section.purpose === 'alerts');

  return {
    entity,
    mapTarget: request.mapTarget || null,
    stateSet: inferStateSet(request),
    metrics,
    mapLabel: hasMap ? `${entity.plural} Distribution` : '',
    trendLabel: `${metrics[0]} Trend`,
    compareLabel: `${entity.plural} Comparison`,
    compositionLabel: `${entity.plural} Status Mix`,
    rankingLabel: `${entity.plural} Ranking`,
    eventLabel: hasAlerts ? `${entity.singular} Events` : 'Events',
    tableLabel: hasTable ? `${entity.plural} Ledger` : 'Ledger',
    tableColumns: [
      { key: 'name', label: entity.singular, width: '1.8fr' },
      { key: 'status', label: 'Status', width: '1fr' },
      { key: 'value', label: metrics[1] || 'Value', width: '1fr' },
    ],
    mapRegions: ['North Hub', 'Central Grid', 'South Cluster', 'West Loop'],
    mapPoints: ['Node A', 'Node B', 'Node C'],
    rankingNames: ['Segment A', 'Segment B', 'Segment C', 'Segment D'],
    stageNames: ['Intake', 'Processing', 'Review', 'Delivery'],
  };
}

function derivePanelChrome(request, references) {
  const styleText = `${request.preferredStyle} ${request.originalPrompt}`.toLowerCase();
  const topReference = references[0];
  const referenceScenes = new Set(references.flatMap((item) => item.sceneTags || []));

  if (/command|指挥|作战|alert|预警/.test(styleText) || referenceScenes.has('security')) {
    return {
      variant: 'command-angled',
      titleBar: 'glow-tab',
      borderStyle: 'double-frame',
    };
  }

  if (/cyan|industrial|network|科技蓝|冷蓝/.test(styleText) || referenceScenes.has('network')) {
    return {
      variant: 'cyan-bracket',
      titleBar: 'split-band',
      borderStyle: 'bracket-frame',
    };
  }

  if (topReference?.features?.darkTone) {
    return {
      variant: 'grid-frame',
      titleBar: 'soft-band',
      borderStyle: 'grid-outline',
    };
  }

  return {
    variant: 'tech-frame',
    titleBar: 'soft-band',
    borderStyle: 'single-frame',
  };
}

function deriveSectionPriority(section) {
  const purpose = canonicalizeSectionToken(section.purpose);
  if (purpose === 'map') return 100;
  if (purpose === 'alerts') return 95;
  if (purpose === 'table') return 92;
  if (purpose === 'trend') return 90;
  if (purpose === 'compare') return 84;
  if (purpose === 'composition') return 78;
  if (purpose === 'ranking') return 74;
  if (purpose === 'kpi') return 70;
  return 76;
}

function deriveHeightPolicy(section, context = {}) {
  const type = section.dataContract.type;
  if (type === 'metric-list') {
    return { fixed: false, min: 120, flex: context.leadershipMode ? 0.72 : 0.8, scroll: false, autoRotate: false };
  }
  if (type === 'map-payload') {
    return { fixed: false, min: 360, flex: 1.8, scroll: false, autoRotate: false };
  }
  if (type === 'event-stream') {
    return { fixed: false, min: 220, flex: 1.1, scroll: true, autoRotate: true };
  }
  if (type === 'row-list') {
    return {
      fixed: false,
      min: context.emphasizeBottomTable ? 320 : 260,
      flex: context.emphasizeBottomTable ? 1.6 : 1.35,
      scroll: true,
      autoRotate: true,
    };
  }

  const purpose = canonicalizeSectionToken(section.purpose);
  if (purpose === 'trend') {
    return { fixed: false, min: 240, flex: 1.2, scroll: false, autoRotate: false };
  }
  if (purpose === 'compare') {
    return { fixed: false, min: 220, flex: 1, scroll: false, autoRotate: false };
  }
  if (purpose === 'composition') {
    return { fixed: false, min: 200, flex: 0.9, scroll: false, autoRotate: false };
  }

  return { fixed: false, min: 220, flex: 1, scroll: false, autoRotate: false };
}

function deriveSectionSizePolicy(section) {
  const isTop = section.area === 'top';
  const isBottom = section.area === 'bottom';
  const isCenter = section.area === 'center' || section.area === 'main';
  const scroll = Boolean(section.heightPolicy?.scroll);

  return {
    widthMode: isCenter ? 'flex' : ['left', 'right', 'side'].includes(section.area) ? 'fixed-or-flex' : 'flex',
    heightMode: isTop ? 'fixed-or-flex' : isBottom ? 'fixed-or-flex' : 'flex',
    minWidth: isCenter ? 0 : 280,
    minHeight: section.heightPolicy?.min ?? 0,
    maxWidth: ['left', 'right', 'side'].includes(section.area) ? 360 : null,
    maxHeight: null,
    overflowMode: scroll ? 'auto' : 'hidden',
    shrinkable: true,
    internalLayout: {
      header: 'fixed',
      content: 'flex',
      contentOverflowOwner: scroll ? 'content' : 'self',
    },
  };
}

function buildHeightStrategy(request, sections, directives = {}) {
  const priorities = sections
    .slice()
    .sort((a, b) => b.priority - a.priority)
    .map((section) => canonicalizeSectionToken(section.purpose));
  const primary = priorities[0] || 'trend';
  const hasTable = priorities.includes('table');
  const hasMap = priorities.includes('map');

  let overall = 'Use weighted blocks with readable minimum heights and avoid page-level vertical scrolling.';
  if (hasMap && hasTable) {
    overall = 'Keep the map and bottom operational table visible above the fold, with the map holding the largest elastic area.';
  } else if (primary === 'trend') {
    overall = 'Give the primary trend chart the largest readable block and keep summary modules compressed.';
  } else if (primary === 'alerts') {
    overall = 'Prioritize the alert stream and supporting table while keeping side summaries compact.';
  }

  const notes = [
    'Use title / primary content / auxiliary content layering instead of equal slices.',
    'Reduce panel count before shrinking typography below big-screen readability limits.',
  ];

  if (request.dataDensity === 'high') {
    notes.push('Allocate more height to tables and event streams for high-density data.');
  }
  if (hasMap) {
    notes.push('Preserve side-column height by keeping KPI blocks out of a full-width top strip.');
  }
  if (directives.emphasizeBottomTable) {
    notes.push('Increase bottom table height so operational rows remain readable above the fold.');
  }
  if (directives.compactRightSummary) {
    notes.push('Keep the right-side summary zone light: one dominant visual plus one supporting module at most.');
  }

  return { overall, notes };
}

function deriveLayoutSizing(layoutPattern, sections, directives = {}) {
  const hasBottom = sections.some((section) => section.area === 'bottom');
  const hasTop = sections.some((section) => section.area === 'top');

  const defaultColumnsByPattern = {
    'overview-home': ['fixed', 'flex', 'fixed'],
    'map-command-page': ['fixed', 'flex', 'fixed'],
    'alarm-center': ['flex', 'flex', 'flex'],
    'monitoring-analysis': ['flex', 'fixed'],
    'thematic-cockpit': ['flex'],
  };

  const rootLayout = {
    viewportMode: 'full-screen',
    widthPolicy: '100vw',
    heightPolicy: '100vh',
    pageOverflow: 'hidden',
  };

  const rowStrategy = {
    top: hasTop ? 'fixed-or-flex' : 'none',
    main: 'flex',
    bottom: hasBottom ? (directives.emphasizeBottomTable ? 'fixed-plus-flex' : 'fixed-or-flex') : 'none',
  };

  return {
    rootLayout,
    columnStrategy: {
      mode: 'mixed',
      pattern: defaultColumnsByPattern[layoutPattern] || ['flex'],
      allowFixedAndFlexMix: true,
    },
    rowStrategy,
    internalSectionRule: {
      sectionMustFillParent: true,
      allowNestedFlex: true,
      requireMinWidthZero: true,
      requireMinHeightZero: true,
      overflowOwner: 'section-content',
    },
    shortScreenStrategy: {
      compressGapFirst: true,
      reduceDecorationFirst: true,
      preservePrimaryViewWeight: true,
      increaseBottomWeightWhenNeeded: true,
    },
  };
}

function inferDirectives(request, desiredSections) {
  const prompt = String(request.originalPrompt || '').toLowerCase();
  const directives = {
    leadershipMode: /领导|executive|leader/.test(prompt),
    emphasizeBottomTable: /底部表格|table.*(larger|taller|bigger)|加高.*表格|表格加高/.test(prompt),
    compactRightSummary: /右侧摘要|summary zone|不要太复杂|简洁图例|single visual/.test(prompt),
    preserveOverview: /首页|overview-home|保留首页|不要切换成专题页/.test(prompt),
    preferAlerts: /告警优先|alert first|先看告警/.test(prompt),
  };

  if (directives.leadershipMode && desiredSections.includes('table') && !directives.emphasizeBottomTable) {
    directives.emphasizeBottomTable = false;
  }

  return directives;
}

function maybeExpandSections(desiredSections, directives) {
  const result = [...desiredSections];
  if (directives.compactRightSummary) {
    if (!result.includes('ranking')) result.push('ranking');
    if (!result.includes('composition')) result.push('composition');
  }
  return [...new Set(result)];
}

function assignAreas(sections, request, directives) {
  const nonTop = sections.filter((section) => section.component !== 'StatCard');
  const sorted = nonTop.slice().sort((a, b) => b.priority - a.priority);
  const hero = sorted[0]?.purpose;
  const pageType = directives.preserveOverview ? 'overview-home' : request.pageType;

  for (const section of sections) {
    const purpose = section.purpose;
    if (section.component === 'StatCard') {
      section.area = 'top';
      continue;
    }

    if (pageType === 'overview-home') {
      if (purpose === hero) section.area = 'center';
      else if (purpose === 'table') section.area = 'bottom';
      else if (purpose === 'alerts') section.area = directives.preferAlerts ? 'center' : 'bottom';
      else if (purpose === 'ranking' || purpose === 'composition') section.area = 'right';
      else if (purpose === 'compare') section.area = 'left';
      else if (purpose === 'trend') section.area = hero === 'trend' ? 'center' : 'left';
      else if (purpose === 'map') section.area = hero === 'map' ? 'center' : 'left';
      else section.area = 'side';
      continue;
    }

    if (pageType === 'map-command-page') {
      if (purpose === 'map') section.area = 'center';
      else if (purpose === 'table' || purpose === 'alerts') section.area = 'bottom';
      else if (purpose === 'ranking' || purpose === 'composition') section.area = 'right';
      else section.area = 'left';
      continue;
    }

    if (pageType === 'alarm-center') {
      if (purpose === 'alerts') section.area = 'center';
      else if (purpose === 'table') section.area = 'bottom';
      else if (purpose === 'composition' || purpose === 'ranking') section.area = 'right';
      else section.area = 'left';
      continue;
    }
  }

  return pageType;
}

export function generateBlueprint(requestInput, options = {}) {
  const request = parseRequestInput(requestInput);
  const templateFeaturesPath = options.templateFeaturesPath || path.resolve(__dirname, '..', 'references', 'template-features.json');
  const maxReferences = Number(options.maxReferences || 5);
  const directives = inferDirectives(request, inferSections(request));
  const desiredSections = maybeExpandSections(inferSections(request), directives);
  const templates = loadTemplateFeatures(templateFeaturesPath)
    .map((template) => ({
      ...template,
      score: scoreTemplate(template, request, desiredSections),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, maxReferences);

  const sections = desiredSections.map((section, index) => {
    const normalized = canonicalizeSectionToken(section);
    const mapped = componentForSection(normalized);
    const baseSection = {
      id: `${mapped.component}-${index + 1}`,
      area: mapped.area,
      purpose: normalized,
      component: mapped.component,
      dataContract: buildDataContract(normalized, request),
    };
    return {
      ...baseSection,
      priority: deriveSectionPriority(baseSection),
      heightPolicy: deriveHeightPolicy(baseSection, directives),
      sizePolicy: null,
    };
  });

  for (const section of sections) {
    section.sizePolicy = deriveSectionSizePolicy(section);
  }

  const layoutPattern = assignAreas(sections, request, directives);

  const blockPriority = sections
    .slice()
    .sort((a, b) => b.priority - a.priority)
    .map((section) => section.purpose);
  const heightStrategy = buildHeightStrategy(request, sections, directives);
  const rightSummaryCount = sections.filter((section) => ['right', 'side'].includes(section.area)).length;
  const layoutDirectives = {
    ...directives,
    heroSection: blockPriority[0] || null,
    rightSummaryCount,
    avoidEqualSplit: true,
  };
  const semanticProfile = inferSemanticProfile(request, sections);
  const panelChrome = derivePanelChrome(request, templates);
  const layoutSizing = deriveLayoutSizing(layoutPattern, sections, layoutDirectives);

  return {
    pageName: request.pageType
      .split('-')
      .map((part) => part[0].toUpperCase() + part.slice(1))
      .join(''),
    goal: `Support ${request.domain} dashboards for ${request.pageType}.`,
    layoutPattern,
    themeDirection: buildThemeDirection(request, templates),
    blockPriority,
    heightStrategy,
    layoutDirectives,
    layoutSizing,
    semanticProfile,
    mapTarget: request.mapTarget || null,
    panelChrome,
    referenceTemplates: templates.map((template) => ({
      id: template.id,
      templateName: template.templateName,
      sceneTags: template.sceneTags,
      pageTypes: template.pageTypes,
      chartFamilies: template.chartFamilies,
      score: template.score,
    })),
    sections,
  };
}

export function formatBlueprintMarkdown(blueprint) {
  return `# ${blueprint.pageName} Blueprint

## Goal

${blueprint.goal}

## Layout Pattern

${blueprint.layoutPattern}

## Theme Direction

${blueprint.themeDirection}

## Block Priority

${(blueprint.blockPriority || []).map((item) => `- ${item}`).join('\n')}

## Height Strategy

${blueprint.heightStrategy?.overall || ''}

${(blueprint.heightStrategy?.notes || []).map((item) => `- ${item}`).join('\n')}

## Layout Directives

${Object.entries(blueprint.layoutDirectives || {})
  .map(([key, value]) => `- ${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
  .join('\n')}

## Layout Sizing

- viewportMode: ${blueprint.layoutSizing?.rootLayout?.viewportMode || ''}
- widthPolicy: ${blueprint.layoutSizing?.rootLayout?.widthPolicy || ''}
- heightPolicy: ${blueprint.layoutSizing?.rootLayout?.heightPolicy || ''}
- pageOverflow: ${blueprint.layoutSizing?.rootLayout?.pageOverflow || ''}
- columnPattern: ${(blueprint.layoutSizing?.columnStrategy?.pattern || []).join(', ')}
- topRow: ${blueprint.layoutSizing?.rowStrategy?.top || ''}
- mainRow: ${blueprint.layoutSizing?.rowStrategy?.main || ''}
- bottomRow: ${blueprint.layoutSizing?.rowStrategy?.bottom || ''}

## Semantic Profile

- entity: ${blueprint.semanticProfile?.entity?.plural || ''}
- metrics: ${(blueprint.semanticProfile?.metrics || []).join(', ')}
- eventLabel: ${blueprint.semanticProfile?.eventLabel || ''}
- tableLabel: ${blueprint.semanticProfile?.tableLabel || ''}

## Panel Chrome

- variant: ${blueprint.panelChrome?.variant || ''}
- titleBar: ${blueprint.panelChrome?.titleBar || ''}
- borderStyle: ${blueprint.panelChrome?.borderStyle || ''}

## Reference Templates

${blueprint.referenceTemplates
  .map((item) => `- ${item.id}: ${item.templateName} | scenes=${item.sceneTags.join(', ')} | charts=${item.chartFamilies.join(', ')}`)
  .join('\n')}

## Sections

${blueprint.sections
  .map(
    (section) =>
      `- ${section.id} | area=${section.area} | component=${section.component} | purpose=${section.purpose} | priority=${section.priority} | min=${section.heightPolicy?.min} | scroll=${section.heightPolicy?.scroll} | autoRotate=${section.heightPolicy?.autoRotate} | widthMode=${section.sizePolicy?.widthMode} | heightMode=${section.sizePolicy?.heightMode} | overflow=${section.sizePolicy?.overflowMode} | data=${section.dataContract.type}`,
  )
  .join('\n')}
`;
}

const isMainModule = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMainModule) {
  const args = parseArgs(process.argv);
  const rawRequest = args['request-file']
    ? fs.readFileSync(path.resolve(args['request-file']), 'utf8')
    : args.request;

  if (!rawRequest) {
    console.error('Usage: node scripts/build-blueprint.mjs --request <json> [--output file]');
    process.exit(1);
  }

  const blueprint = generateBlueprint(rawRequest, {
    templateFeaturesPath: args['template-features'] ? path.resolve(args['template-features']) : undefined,
    maxReferences: args.limit ? Number(args.limit) : undefined,
  });

  const outputText = args.format === 'json' ? JSON.stringify(blueprint, null, 2) : formatBlueprintMarkdown(blueprint);

  if (args.output) {
    const outputPath = path.resolve(args.output);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, outputText, 'utf8');
    console.log(`Wrote blueprint to ${outputPath}`);
  } else {
    console.log(outputText);
  }
}
