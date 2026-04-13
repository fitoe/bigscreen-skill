#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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
    .split(/[,，]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function parseRequestInput(raw) {
  const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
  return {
    domain: parsed.domain || 'general',
    pageType: parsed.pageType || 'overview-home',
    audience: parsed.audience || 'operations',
    mustHaveSections: normalizeArray(parsed.mustHaveSections),
    keyMetrics: normalizeArray(parsed.keyMetrics),
    preferredStyle: parsed.preferredStyle || 'deep blue glow',
    dataDensity: parsed.dataDensity || 'medium',
    mapRequired: Boolean(parsed.mapRequired),
    refreshExpectation: parsed.refreshExpectation || 'realtime',
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
  const lower = sectionName.toLowerCase();
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
  if (/kpi|summary|metrics|stats/.test(sectionName)) return { type: 'metric-list', keys: request.keyMetrics };
  if (/map|geo/.test(sectionName)) return { type: 'map-payload', keys: ['regions', 'points', ...request.keyMetrics] };
  if (/alert|alarm|event/.test(sectionName)) return { type: 'event-stream', keys: ['time', 'level', 'message'] };
  if (/table|list/.test(sectionName)) return { type: 'row-list', keys: ['id', 'name', 'status', 'value'] };
  return { type: 'chart-series', keys: ['categories', 'series'] };
}

export function generateBlueprint(requestInput, options = {}) {
  const request = parseRequestInput(requestInput);
  const templateFeaturesPath = options.templateFeaturesPath || path.resolve(__dirname, '..', 'references', 'template-features.json');
  const maxReferences = Number(options.maxReferences || 5);
  const desiredSections = inferSections(request);
  const templates = loadTemplateFeatures(templateFeaturesPath)
    .map((template) => ({
      ...template,
      score: scoreTemplate(template, request, desiredSections),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, maxReferences);

  const sections = desiredSections.map((section, index) => {
    const normalized = section.toLowerCase();
    const mapped = componentForSection(normalized);
    return {
      id: `${mapped.component}-${index + 1}`,
      area: mapped.area,
      purpose: normalized,
      component: mapped.component,
      dataContract: buildDataContract(normalized, request),
    };
  });

  return {
    pageName: request.pageType
      .split('-')
      .map((part) => part[0].toUpperCase() + part.slice(1))
      .join(''),
    goal: `Support ${request.domain} dashboards for ${request.pageType}.`,
    layoutPattern: request.pageType,
    themeDirection: buildThemeDirection(request, templates),
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

## Reference Templates

${blueprint.referenceTemplates
  .map((item) => `- ${item.id}: ${item.templateName} | scenes=${item.sceneTags.join(', ')} | charts=${item.chartFamilies.join(', ')}`)
  .join('\n')}

## Sections

${blueprint.sections
  .map(
    (section) =>
      `- ${section.id} | area=${section.area} | component=${section.component} | purpose=${section.purpose} | data=${section.dataContract.type}`,
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
