#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { generateBlueprint } from './build-blueprint.mjs';
import { downloadDatavGeoJson, resolveDatavMapTarget } from './datav-geojson.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

function toSlug(value) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/\s+/g, '-')
    .toLowerCase();
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyDir(source, target) {
  ensureDir(target);
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const from = path.join(source, entry.name);
    const to = path.join(target, entry.name);
    if (entry.isDirectory()) copyDir(from, to);
    else fs.copyFileSync(from, to);
  }
}

async function materializeMapGeoJson(blueprint, target, fetchImpl = fetch) {
  const hasMapSection = blueprint.sections.some((section) => section.component === 'MapPanel');
  if (!hasMapSection || !blueprint.mapTarget) return null;

  try {
    const resolved = await resolveDatavMapTarget(blueprint.mapTarget, fetchImpl);
    if (!resolved) return null;

    const mapsDir = path.join(target, 'src', 'mock', 'maps');
    ensureDir(mapsDir);
    const filePath = path.join(mapsDir, resolved.assetFileName);
    const asset = await downloadDatavGeoJson(filePath, resolved, fetchImpl);
    if (!asset) return null;
    fs.writeFileSync(filePath, JSON.stringify(asset.json, null, 2), 'utf8');

    return {
      ...resolved,
      filePath,
      importPath: `@/mock/maps/${resolved.assetFileName}`,
    };
  } catch {
    return null;
  }
}

function componentImportPath(component) {
  if (['LineTrendChart', 'BarCompareChart', 'PieRingChart'].includes(component)) {
    return `@/components/bigscreen/charts/${component}.vue`;
  }
  if (component.startsWith('Section')) {
    return `@/components/bigscreen/sections/${component}.vue`;
  }
  return `@/components/bigscreen/${component}.vue`;
}

function indentBlock(text, spaces = 8) {
  const indent = ' '.repeat(spaces);
  return text
    .split('\n')
    .map((line) => `${indent}${line}`)
    .join('\n');
}

function toTitle(value) {
  return String(value)
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function toPascalCase(value) {
  return String(value)
    .replace(/[-_]+/g, ' ')
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join('');
}

function dataBindingForSection(section) {
  const title = toTitle(section.purpose);
  switch (section.component) {
    case 'StatCard':
      return `v-for="item in view.stats"\n          :key="item.label"\n          :label="item.label"\n          :value="item.value"\n          :unit="item.unit"\n          :delta="item.delta"`;
    case 'MapPanel':
      return `title="${title}"\n          :regions="view.mapRegions"\n          :points="view.mapPoints"\n          :geo-json="view.mapGeoJson"\n          :map-meta="view.mapMeta"`;
    case 'AlarmTicker':
      return `title="${title}"\n          :items="view.alarms"`;
    case 'RankingList':
      return `title="${title}"\n          :items="view.ranking"`;
    case 'ScrollTable':
      return `title="${title}"\n          :columns="view.table.columns"\n          :rows="view.table.rows"`;
    case 'LineTrendChart':
      return `title="${title}"\n          :categories="view.trend.categories"\n          :series="view.trend.series"`;
    case 'BarCompareChart':
      return `title="${title}"\n          :categories="view.compare.categories"\n          :series="view.compare.series"`;
    case 'PieRingChart':
      return `title="${title}"\n          :items="view.composition"`;
    default:
      return `title="${title}"`;
  }
}

function dataBindingForGeneratedSection(section) {
  const title = toTitle(section.purpose);
  const type = section.dataContract?.type || 'chart-series';
  if (type === 'metric-list') {
    return `title="${title}"\n          :items="view.stats"`;
  }
  if (type === 'map-payload') {
    return `title="${title}"\n          :regions="view.mapRegions"\n          :points="view.mapPoints"\n          :geo-json="view.mapGeoJson"\n          :map-meta="view.mapMeta"`;
  }
  if (type === 'event-stream') {
    return `title="${title}"\n          :items="view.alarms"`;
  }
  if (type === 'row-list') {
    return `title="${title}"\n          :columns="view.table.columns"\n          :rows="view.table.rows"`;
  }
  if (type === 'chart-series') {
    if (section.purpose.includes('compare')) {
      return `title="${title}"\n          :categories="view.compare.categories"\n          :series="view.compare.series"`;
    }
    if (section.purpose.includes('composition')) {
      return `title="${title}"\n          :items="view.composition"`;
    }
    return `title="${title}"\n          :categories="view.trend.categories"\n          :series="view.trend.series"`;
  }
  return `title="${title}"`;
}

function buildSectionComponentSource(componentName, section, layoutPattern) {
  const contractType = section.dataContract?.type || 'chart-series';
  const imports = [];
  let useWrapper = true;
  let propsSource = 'defineProps<{ title: string }>();';
  let templateBody = '<div class="placeholder">Replace with real content</div>';

  if (contractType === 'metric-list') {
    imports.push(`import PanelCard from '@/components/bigscreen/PanelCard.vue';`);
    propsSource = `defineProps<{ title: string; items: Array<{ label: string; value: string | number; unit?: string; delta: number }> }>();`;
    templateBody = `<ul class="grid list-none gap-3 p-0">
      <li v-for="item in items" :key="item.label" class="grid gap-1 rounded-xl border border-cyan-300/10 bg-slate-950/22 px-4 py-3">
        <span class="text-sm text-slate-300/72">{{ item.label }}</span>
        <strong class="text-2xl font-semibold text-slate-50">{{ item.value }}</strong>
      </li>
    </ul>`;
  } else if (contractType === 'map-payload') {
    useWrapper = false;
    imports.push(`import MapPanel from '@/components/bigscreen/MapPanel.vue';`);
    propsSource = `defineProps<{ title: string; regions: unknown[]; points: unknown[]; geoJson?: Record<string, unknown> | null; mapMeta?: Record<string, unknown> | null }>();`;
    templateBody = `<MapPanel :title="title" :regions="regions" :points="points" :geo-json="geoJson" :map-meta="mapMeta" />`;
  } else if (contractType === 'event-stream') {
    useWrapper = false;
    imports.push(`import AlarmTicker from '@/components/bigscreen/AlarmTicker.vue';`);
    propsSource = `defineProps<{ title: string; items: Array<{ time: string; level: string; message: string }> }>();`;
    templateBody = `<AlarmTicker :title="title" :items="items" />`;
  } else if (contractType === 'row-list') {
    useWrapper = false;
    imports.push(`import ScrollTable from '@/components/bigscreen/ScrollTable.vue';`);
    propsSource = `defineProps<{ title: string; columns: Array<{ key: string; label: string; width?: string }>; rows: Array<Record<string, string | number>> }>();`;
    templateBody = `<ScrollTable :title="title" :columns="columns" :rows="rows" />`;
  } else if (contractType === 'chart-series') {
    useWrapper = false;
    propsSource = `defineProps<{ title: string; categories?: string[]; series?: number[]; items?: Array<{ name: string; value: number }> }>();`;
    if (section.purpose.includes('compare')) {
      imports.push(`import BarCompareChart from '@/components/bigscreen/charts/BarCompareChart.vue';`);
      templateBody = `<BarCompareChart :title="title" :categories="categories ?? []" :series="series ?? []" />`;
    } else if (section.purpose.includes('composition')) {
      imports.push(`import PieRingChart from '@/components/bigscreen/charts/PieRingChart.vue';`);
      templateBody = `<PieRingChart :title="title" :items="items ?? []" />`;
    } else {
      imports.push(`import LineTrendChart from '@/components/bigscreen/charts/LineTrendChart.vue';`);
      templateBody = `<LineTrendChart :title="title" :categories="categories ?? []" :series="series ?? []" />`;
    }
  }

  if (layoutPattern === 'thematic-cockpit' && contractType === 'chart-series' && !section.purpose.includes('compare') && !section.purpose.includes('composition')) {
    imports.length = 0;
    imports.push(`import LineTrendChart from '@/components/bigscreen/charts/LineTrendChart.vue';`);
    templateBody = `<LineTrendChart :title="title" :categories="categories ?? []" :series="series ?? []" />`;
  }

  const templateSource = useWrapper
    ? `<template>
  <PanelCard :title="title">
    ${templateBody}
  </PanelCard>
</template>`
    : `<template>
  ${templateBody}
</template>`;

  return `${templateSource}

<script setup lang="ts">
${imports.join('\n')}
${propsSource}
</script>
`;
}

function sectionMarkup(section) {
  if (section.component === 'StatCard') {
    return `<section class="grid gap-4 xl:grid-cols-4">
  <StatCard
    ${dataBindingForSection(section)}
  />
</section>`;
  }

  const binding = section.component.startsWith('Section') ? dataBindingForGeneratedSection(section) : dataBindingForSection(section);
  return `<${section.component}
  ${binding}
/>`;
}

function buildPanelSlot(section) {
  const minHeight = section.heightPolicy?.min ?? 0;
  const minValue = section.heightPolicy?.scroll ? Math.max(minHeight, 220) : minHeight;
  return `<div class="min-w-0" style="min-height: ${minValue}px">
${indentBlock(sectionMarkup(section), 2)}
</div>`;
}

function groupSections(sections) {
  return {
    top: sections.filter((section) => section.component === 'StatCard'),
    left: sections.filter((section) => section.area === 'left'),
    center: sections.filter((section) => section.area === 'center'),
    right: sections.filter((section) => section.area === 'right'),
    side: sections.filter((section) => section.area === 'side'),
    main: sections.filter((section) => section.area === 'main'),
    bottom: sections.filter((section) => section.area === 'bottom'),
  };
}

function renderTopSections(groups) {
  if (!groups.top.length) return '';
  return groups.top.map((section) => indentBlock(sectionMarkup(section), 6)).join('\n');
}

function renderOverviewLayout(groups) {
  const leftSections = [...groups.left, ...groups.side.slice(0, 1)];
  const centerSections = [...groups.center];
  const rightSections = [...groups.right, ...groups.side.slice(1)];
  return `
      <section class="grid items-stretch gap-5 xl:grid-cols-[320px_minmax(0,1.2fr)_320px] max-[1280px]:grid-cols-1 max-[900px]:gap-4">
        <div class="grid gap-5 max-[900px]:gap-4">
${leftSections.map((section) => `          ${buildPanelSlot(section)}`).join('\n')}
        </div>
        <div class="grid gap-5 max-[900px]:gap-4">
${centerSections.map((section) => `          ${buildPanelSlot(section)}`).join('\n')}
        </div>
        <div class="grid gap-5 max-[900px]:gap-4">
${rightSections.map((section) => `          ${buildPanelSlot(section)}`).join('\n')}
        </div>
      </section>`;
}

function renderMonitoringLayout(groups) {
  const mainSections = [...groups.left, ...groups.main, ...groups.right];
  const sideSections = [...groups.side];
  return `
      <section class="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_360px] max-[1280px]:grid-cols-1 max-[900px]:gap-4">
        <div class="grid gap-5 max-[900px]:gap-4">
${mainSections.map((section) => `          ${buildPanelSlot(section)}`).join('\n')}
        </div>
        <div class="grid gap-5 max-[900px]:gap-4">
${sideSections.map((section) => `          ${buildPanelSlot(section)}`).join('\n')}
        </div>
      </section>`;
}

function renderAlarmLayout(groups) {
  return `
      <section class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1fr)] max-[1280px]:grid-cols-1 max-[900px]:gap-4">
        <div class="grid gap-5 max-[900px]:gap-4">
${groups.left.map((section) => `          ${buildPanelSlot(section)}`).join('\n')}
        </div>
        <div class="grid gap-5 max-[900px]:gap-4">
${groups.center.map((section) => `          ${buildPanelSlot(section)}`).join('\n')}
        </div>
        <div class="grid gap-5 max-[900px]:gap-4">
${[...groups.right, ...groups.side].map((section) => `          ${buildPanelSlot(section)}`).join('\n')}
        </div>
      </section>`;
}

function renderMapCommandLayout(groups) {
  return `
      <section class="grid gap-5 xl:grid-cols-[320px_minmax(0,1.4fr)_320px] max-[1280px]:grid-cols-1 max-[900px]:gap-4">
        <div class="grid gap-5 max-[900px]:gap-4">
${[...groups.left, ...groups.side].map((section) => `          ${buildPanelSlot(section)}`).join('\n')}
        </div>
        <div class="grid gap-5 max-[900px]:gap-4">
${groups.center.map((section) => `          ${buildPanelSlot(section)}`).join('\n')}
        </div>
        <div class="grid gap-5 max-[900px]:gap-4">
${groups.right.map((section) => `          ${buildPanelSlot(section)}`).join('\n')}
        </div>
      </section>`;
}

function renderThematicLayout(groups) {
  const heroSection = groups.center[0] || groups.main[0] || groups.left[0] || groups.right[0] || groups.side[0] || null;
  const supportSections = [...groups.left, ...groups.right, ...groups.side, ...groups.main].filter((section) => section !== heroSection);
  return `
      ${heroSection ? `<section class="grid">
${indentBlock(sectionMarkup(heroSection), 8)}
      </section>` : ''}
      <section class="grid gap-5 xl:grid-cols-2 max-[1280px]:grid-cols-1 max-[900px]:gap-4">
${supportSections.map((section) => `        ${buildPanelSlot(section)}`).join('\n')}
      </section>`;
}

function renderBottomSections(groups) {
  if (!groups.bottom.length) return '';
  return `
      <section class="grid gap-5 xl:grid-cols-2 max-[1280px]:grid-cols-1 max-[900px]:gap-4">
${groups.bottom.map((section) => `        ${buildPanelSlot(section)}`).join('\n')}
      </section>`;
}

function renderLayoutSections(layoutPattern, groups) {
  switch (layoutPattern) {
    case 'monitoring-analysis':
      return renderMonitoringLayout(groups);
    case 'alarm-center':
      return renderAlarmLayout(groups);
    case 'thematic-cockpit':
      return renderThematicLayout(groups);
    case 'map-command-page':
      return renderMapCommandLayout(groups);
    case 'overview-home':
    default:
      return renderOverviewLayout(groups);
  }
}

function buildViewSource(projectName, blueprint) {
  const { sections, layoutPattern } = blueprint;
  const chromeVariant = blueprint.panelChrome?.variant || 'tech-frame';
  const normalizedSections = sections.map((section, index) => {
    if (section.component !== 'PanelCard') return section;
    const name = section.purpose ? `Section${toPascalCase(section.purpose)}` : `SectionBlock${index + 1}`;
    return {
      ...section,
      component: name,
    };
  });
  const imports = [...new Set(['HeaderBar', ...normalizedSections.map((section) => section.component), 'ScreenShell'])]
    .map((component) => `import ${component} from '${componentImportPath(component)}';`)
    .join('\n');

  const groups = groupSections(normalizedSections);
  const renderedTop = renderTopSections(groups);
  const renderedMain = renderLayoutSections(layoutPattern || 'overview-home', groups);
  const renderedBottom = renderBottomSections(groups);

  return `<template>
  <BigscreenLayout>
    <ScreenShell variant="${chromeVariant}">
      <HeaderBar :title="view.title" :subtitle="view.subtitle" :status-items="view.statusItems" />
      <div class="grid min-h-0 flex-1 gap-5 [grid-template-rows:auto_minmax(0,1fr)_auto]">
${renderedTop}
${renderedMain}
${renderedBottom}
      </div>
    </ScreenShell>
  </BigscreenLayout>
</template>

<script setup lang="ts">
${imports}
import BigscreenLayout from '@/layouts/BigscreenLayout.vue';
import { use${projectName} } from '@/composables/use${projectName}';

const view = use${projectName}();
</script>
`;
}

function buildMockSource(projectName, blueprint, mapAsset = null) {
  const mockVar = `${projectName[0].toLowerCase()}${projectName.slice(1)}Mock`;
  const needs = new Set(blueprint.sections.map((section) => section.component));
  const profile = blueprint.semanticProfile || {};
  const entity = profile.entity || { singular: 'Asset', plural: 'Assets' };
  const metrics = Array.isArray(profile.metrics) && profile.metrics.length ? profile.metrics : [`Active ${entity.plural}`, 'Alerts', 'Load', 'Completion Rate'];
  const states = Array.isArray(profile.stateSet) && profile.stateSet.length ? profile.stateSet : ['Healthy', 'Warning', 'Critical'];
  const rankingNames = Array.isArray(profile.rankingNames) && profile.rankingNames.length ? profile.rankingNames : ['Segment A', 'Segment B', 'Segment C', 'Segment D'];
  const mapRegions = Array.isArray(profile.mapRegions) && profile.mapRegions.length ? profile.mapRegions : ['North Hub', 'Central Grid', 'South Cluster', 'West Loop'];
  const mapPoints = Array.isArray(profile.mapPoints) && profile.mapPoints.length ? profile.mapPoints : ['Node A', 'Node B', 'Node C'];
  const tableColumns = Array.isArray(profile.tableColumns) && profile.tableColumns.length ? profile.tableColumns : [
    { key: 'name', label: entity.singular, width: '1.8fr' },
    { key: 'status', label: 'Status', width: '1fr' },
    { key: 'value', label: metrics[1] || 'Value', width: '1fr' },
  ];
  const stageNames = Array.isArray(profile.stageNames) && profile.stageNames.length ? profile.stageNames : ['Intake', 'Processing', 'Review', 'Delivery'];
  const mapImport = mapAsset ? `import mapGeoJson from './maps/${mapAsset.assetFileName}';\n\n` : '';

  return `${mapImport}export const ${mockVar} = {
  title: '${projectName.replace(/([a-z0-9])([A-Z])/g, '$1 $2')}',
  subtitle: '${blueprint.themeDirection}',
  statusItems: [
    { label: 'Updated', value: 'Realtime' },
    { label: 'Mode', value: 'Blueprint' },
  ],
  stats: [
    { label: '${metrics[0]}', value: 1284, unit: '', delta: 3.2 },
    { label: '${metrics[1] || 'Alerts'}', value: 912, unit: '', delta: 1.8 },
    { label: '${metrics[2] || 'Load'}', value: 18, unit: '', delta: -0.6 },
    { label: '${metrics[3] || 'Completion Rate'}', value: 94.6, unit: '%', delta: 2.1 },
  ],
  trend: {
    categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    series: [120, 132, 141, 158, 149, 167, 173],
  },
  trendSecondary: {
    categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    series: [90, 96, 98, 120, 110, 108, 130],
  },
  mapRegions: [
    { name: '${mapRegions[0]}', value: '128 ${entity.plural.toLowerCase()}' },
    { name: '${mapRegions[1]}', value: '32 events' },
    { name: '${mapRegions[2]}', value: '84 tasks' },
    { name: '${mapRegions[3]}', value: '96.4%' },
  ],
  mapPoints: [
    { name: '${mapPoints[0]}', x: 28, y: 34 },
    { name: '${mapPoints[1]}', x: 64, y: 42 },
    { name: '${mapPoints[2]}', x: 44, y: 66 },
  ],
  mapGeoJson: ${mapAsset ? 'mapGeoJson' : 'null'},
  mapMeta: ${JSON.stringify(
    mapAsset
      ? {
          adcode: mapAsset.adcode,
          level: mapAsset.level,
          name: mapAsset.name,
          sourceUrl: mapAsset.sourceUrl,
        }
      : null,
    null,
    2,
  ).replace(/\n/g, '\n  ')},
  compare: {
    categories: ['Alpha', 'Beta', 'Gamma', 'Delta', 'Omega'],
    series: [88, 121, 96, 104, 137],
  },
  composition: [
    { name: '${states[0]}', value: 72 },
    { name: '${states[1]}', value: 18 },
    { name: '${states[2]}', value: 10 },
  ],
  ranking: [
    { name: '${rankingNames[0]}', value: 98 },
    { name: '${rankingNames[1]}', value: 91 },
    { name: '${rankingNames[2]}', value: 84 },
    { name: '${rankingNames[3]}', value: 78 },
  ],
  alarms: [
    { time: '09:12', message: '${entity.singular} telemetry drift detected', level: 'major' as const },
    { time: '09:18', message: '${entity.singular} access anomaly detected', level: 'minor' as const },
    { time: '09:24', message: '${entity.singular} load spike exceeds threshold', level: 'critical' as const },
  ],
  table: {
    columns: ${JSON.stringify(tableColumns, null, 4).replace(/\n/g, '\n    ')},
    rows: [
      { id: 1, name: '${entity.singular} 01', status: '${states[0]}', value: '56.2' },
      { id: 2, name: '${entity.singular} 02', status: '${states[1]}', value: '83.4' },
      { id: 3, name: '${entity.singular} 03', status: '${states[0]}', value: 'Online' },
    ],
  },
  pipeline: [
    { name: '${stageNames[0]}', value: 42 },
    { name: '${stageNames[1]}', value: 33 },
    { name: '${stageNames[2]}', value: 21 },
    { name: '${stageNames[3]}', value: 16 },
  ],
  meta: {
    sections: ${JSON.stringify([...needs], null, 2).replace(/\n/g, '\n    ')},
    semanticProfile: ${JSON.stringify(profile, null, 2).replace(/\n/g, '\n    ')},
  },
};
`;
}

function buildComposableSource(projectName) {
  const slug = toSlug(projectName);
  const mockVar = `${projectName[0].toLowerCase()}${projectName.slice(1)}Mock`;
  return `import { ${mockVar} } from '@/mock/${slug}';

export function use${projectName}() {
  return ${mockVar};
}
`;
}

function buildDocSource(projectName, blueprint) {
  return `# ${projectName}

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

## Semantic Profile

- entity=${blueprint.semanticProfile?.entity?.plural || ''}
- metrics=${(blueprint.semanticProfile?.metrics || []).join(', ')}
- eventLabel=${blueprint.semanticProfile?.eventLabel || ''}

## Panel Chrome

- variant=${blueprint.panelChrome?.variant || ''}
- titleBar=${blueprint.panelChrome?.titleBar || ''}
- borderStyle=${blueprint.panelChrome?.borderStyle || ''}

## Reference Templates

${blueprint.referenceTemplates.map((item) => `- ${item.id}: ${item.templateName} | scenes=${item.sceneTags.join(', ')} | charts=${item.chartFamilies.join(', ')}`).join('\n')}

## Sections

${blueprint.sections.map((section) => `- ${section.id} | component=${section.component} | area=${section.area} | purpose=${section.purpose} | priority=${section.priority} | min=${section.heightPolicy?.min} | scroll=${section.heightPolicy?.scroll} | autoRotate=${section.heightPolicy?.autoRotate}`).join('\n')}
`;
}

function updateRouterSource(routerSource, projectName) {
  return `import { createRouter, createWebHistory } from 'vue-router';

const ${projectName} = () => import('@/views/${projectName}.vue');

export default createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: '${toSlug(projectName)}',
      component: ${projectName},
    },
  ],
});
`;
}

export async function generateProjectFromBlueprint(blueprint, options = {}) {
  const target = path.resolve(options.target);
  const projectName = options.projectName || blueprint.pageName;
  const starter = path.resolve(__dirname, '..', 'assets', 'starter');
  const slug = toSlug(projectName);

  if (!options.target) {
    throw new Error('target is required');
  }

  copyDir(starter, target);
  const mapAsset = await materializeMapGeoJson(blueprint, target, options.fetchImpl || fetch);

  const filesToRemove = [
    path.join(target, 'src', 'views', 'GeneratedOverview.vue'),
    path.join(target, 'src', 'composables', 'useGeneratedOverview.ts'),
    path.join(target, 'src', 'mock', 'generated-overview.ts'),
    path.join(target, 'docs', 'screen-specs', 'generated-overview.md'),
  ];

  for (const file of filesToRemove) {
    if (fs.existsSync(file)) fs.rmSync(file, { force: true });
  }

  const viewSource = buildViewSource(projectName, blueprint);
  fs.writeFileSync(path.join(target, 'src', 'views', `${projectName}.vue`), viewSource, 'utf8');
  fs.writeFileSync(path.join(target, 'src', 'composables', `use${projectName}.ts`), buildComposableSource(projectName), 'utf8');
  fs.writeFileSync(path.join(target, 'src', 'mock', `${slug}.ts`), buildMockSource(projectName, blueprint, mapAsset), 'utf8');
  fs.writeFileSync(path.join(target, 'docs', 'screen-specs', `${slug}.md`), buildDocSource(projectName, blueprint), 'utf8');

  const sectionDir = path.join(target, 'src', 'components', 'bigscreen', 'sections');
  const generatedSections = blueprint.sections
    .map((section, index) => {
      if (section.component !== 'PanelCard') return null;
      const name = section.purpose ? `Section${toPascalCase(section.purpose)}` : `SectionBlock${index + 1}`;
      return { name, section };
    })
    .filter(Boolean);

  if (generatedSections.length) {
    ensureDir(sectionDir);
    for (const entry of generatedSections) {
      fs.writeFileSync(path.join(sectionDir, `${entry.name}.vue`), buildSectionComponentSource(entry.name, entry.section, blueprint.layoutPattern), 'utf8');
    }
  }

  const routerFile = path.join(target, 'src', 'router', 'index.ts');
  fs.writeFileSync(routerFile, updateRouterSource(fs.readFileSync(routerFile, 'utf8'), projectName), 'utf8');

  return {
    target,
    projectName,
    slug,
  };
}

const isMainModule = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMainModule) {
  const args = parseArgs(process.argv);
  const target = args.target ? path.resolve(args.target) : null;
  if (!target) {
    console.error('Usage: node scripts/generate-from-blueprint.mjs --blueprint-file <file> --target <dir> [--name Name]');
    process.exit(1);
  }

  let blueprint;
  if (args['blueprint-file']) {
    const input = fs.readFileSync(path.resolve(args['blueprint-file']), 'utf8').replace(/^\uFEFF/, '');
    blueprint = JSON.parse(input);
  } else if (args['request-file']) {
    const request = fs.readFileSync(path.resolve(args['request-file']), 'utf8');
    blueprint = generateBlueprint(request, {
      templateFeaturesPath: args['template-features'] ? path.resolve(args['template-features']) : undefined,
      maxReferences: args.limit ? Number(args.limit) : undefined,
    });
  } else {
    console.error('Provide --blueprint-file or --request-file');
    process.exit(1);
  }

  const result = await generateProjectFromBlueprint(blueprint, {
    target,
    projectName: args.name || blueprint.pageName,
  });
  console.log(`Generated ${result.projectName} at ${result.target}`);
}
