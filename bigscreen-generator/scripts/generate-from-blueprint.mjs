#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { generateBlueprint } from './build-blueprint.mjs';

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
      return `title="${title}"\n          :regions="view.mapRegions"\n          :points="view.mapPoints"`;
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
    return `title="${title}"\n          :regions="view.mapRegions"\n          :points="view.mapPoints"`;
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
    templateBody = `<ul class="metric-list">
      <li v-for="item in items" :key="item.label">
        <span>{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
      </li>
    </ul>`;
  } else if (contractType === 'map-payload') {
    useWrapper = false;
    imports.push(`import MapPanel from '@/components/bigscreen/MapPanel.vue';`);
    propsSource = `defineProps<{ title: string; regions: unknown[]; points: unknown[] }>();`;
    templateBody = `<MapPanel :title="title" :regions="regions" :points="points" />`;
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

<style scoped lang="scss">
.placeholder,
.map-placeholder,
.chart-placeholder {
  color: var(--text-secondary);
}

.map-placeholder {
  position: relative;
  min-height: 220px;
  border-radius: var(--radius-md);
  background: radial-gradient(circle at 30% 30%, rgba(46, 240, 197, 0.2), rgba(7, 17, 31, 0.6));
}

.glow-ring {
  position: absolute;
  top: 12%;
  left: 12%;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 1px solid rgba(83, 213, 255, 0.4);
}

.event-list--alert .level {
  text-transform: uppercase;
  color: var(--danger);
}

.chart-placeholder--monitoring {
  border-left: 2px solid rgba(83, 213, 255, 0.35);
  padding-left: 16px;
}

.chart-placeholder--thematic {
  border: 1px dashed rgba(83, 213, 255, 0.35);
  padding: 12px;
}

.metric-list,
.event-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: var(--space-2);
}

.table {
  width: 100%;
  border-collapse: collapse;
  color: var(--text-secondary);
}

th,
td {
  padding: 8px 6px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  text-align: left;
}
</style>
`;
}

function sectionMarkup(section) {
  if (section.component === 'StatCard') {
    return `<section class="stats-grid">
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
  const scrollClass = section.heightPolicy?.scroll ? ' panel-slot--scroll' : '';
  return `<div class="panel-slot panel-slot--${section.area}${scrollClass}" style="--section-min-height: ${minHeight}px">
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
      <section class="hero-grid hero-grid--overview-home">
        <div class="hero-column hero-column--left">
${leftSections.map((section) => `          ${buildPanelSlot(section)}`).join('\n')}
        </div>
        <div class="hero-column hero-column--center">
${centerSections.map((section) => `          ${buildPanelSlot(section)}`).join('\n')}
        </div>
        <div class="hero-column hero-column--right">
${rightSections.map((section) => `          ${buildPanelSlot(section)}`).join('\n')}
        </div>
      </section>`;
}

function renderMonitoringLayout(groups) {
  const mainSections = [...groups.left, ...groups.main, ...groups.right];
  const sideSections = [...groups.side];
  return `
      <section class="hero-grid hero-grid--monitoring-analysis">
        <div class="hero-column hero-column--main">
${mainSections.map((section) => `          ${buildPanelSlot(section)}`).join('\n')}
        </div>
        <div class="hero-column hero-column--side">
${sideSections.map((section) => `          ${buildPanelSlot(section)}`).join('\n')}
        </div>
      </section>`;
}

function renderAlarmLayout(groups) {
  return `
      <section class="hero-grid hero-grid--alarm-center">
        <div class="hero-column hero-column--left">
${groups.left.map((section) => `          ${buildPanelSlot(section)}`).join('\n')}
        </div>
        <div class="hero-column hero-column--center">
${groups.center.map((section) => `          ${buildPanelSlot(section)}`).join('\n')}
        </div>
        <div class="hero-column hero-column--right">
${[...groups.right, ...groups.side].map((section) => `          ${buildPanelSlot(section)}`).join('\n')}
        </div>
      </section>`;
}

function renderMapCommandLayout(groups) {
  return `
      <section class="hero-grid hero-grid--map-command-page">
        <div class="hero-column hero-column--left">
${[...groups.left, ...groups.side].map((section) => `          ${buildPanelSlot(section)}`).join('\n')}
        </div>
        <div class="hero-column hero-column--center">
${groups.center.map((section) => `          ${buildPanelSlot(section)}`).join('\n')}
        </div>
        <div class="hero-column hero-column--right">
${groups.right.map((section) => `          ${buildPanelSlot(section)}`).join('\n')}
        </div>
      </section>`;
}

function renderThematicLayout(groups) {
  const heroSection = groups.center[0] || groups.main[0] || groups.left[0] || groups.right[0] || groups.side[0] || null;
  const supportSections = [...groups.left, ...groups.right, ...groups.side, ...groups.main].filter((section) => section !== heroSection);
  return `
      ${heroSection ? `<section class="hero-banner">
${indentBlock(sectionMarkup(heroSection), 8)}
      </section>` : ''}
      <section class="support-grid support-grid--thematic-cockpit">
${supportSections.map((section) => `        ${buildPanelSlot(section)}`).join('\n')}
      </section>`;
}

function renderBottomSections(groups) {
  if (!groups.bottom.length) return '';
  return `
      <section class="bottom-grid">
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
    <ScreenShell>
      <HeaderBar :title="view.title" :subtitle="view.subtitle" :status-items="view.statusItems" />

${renderedTop}
${renderedMain}
${renderedBottom}
    </ScreenShell>
  </BigscreenLayout>
</template>

<script setup lang="ts">
${imports}
import BigscreenLayout from '@/layouts/BigscreenLayout.vue';
import { use${projectName} } from '@/composables/use${projectName}';

const view = use${projectName}();
</script>

<style scoped lang="scss">
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-4);
}

.hero-grid,
.bottom-grid {
  display: grid;
  gap: var(--space-5);
}

.hero-grid {
  display: grid;
  gap: var(--space-5);
  align-items: stretch;
}

.hero-column,
.support-grid,
.bottom-grid {
  display: grid;
  gap: var(--space-5);
}

.hero-grid--overview-home {
  grid-template-columns: 320px minmax(0, 1.2fr) 320px;
}

.hero-grid--monitoring-analysis {
  grid-template-columns: minmax(0, 1.45fr) 360px;
}

.hero-grid--alarm-center {
  grid-template-columns: 1fr 1.2fr 1fr;
}

.hero-grid--map-command-page {
  grid-template-columns: 320px minmax(0, 1.4fr) 320px;
}

.hero-banner {
  display: grid;
}

.support-grid--thematic-cockpit {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.bottom-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.panel-slot {
  min-width: 0;
  min-height: var(--section-min-height, 0px);
}

.panel-slot > * {
  height: 100%;
}

.panel-slot--scroll {
  min-height: max(var(--section-min-height, 0px), 220px);
}

@media (max-height: 900px) {
  .hero-grid,
  .bottom-grid,
  .hero-column,
  .support-grid {
    gap: var(--space-4);
  }

  .panel-slot {
    min-height: max(calc(var(--section-min-height, 0px) - 20px), 160px);
  }
}

@media (max-width: 1280px) {
  .stats-grid,
  .hero-grid,
  .support-grid--thematic-cockpit,
  .bottom-grid {
    grid-template-columns: 1fr;
  }
}
</style>
`;
}

function buildMockSource(projectName, blueprint) {
  const mockVar = `${projectName[0].toLowerCase()}${projectName.slice(1)}Mock`;
  const needs = new Set(blueprint.sections.map((section) => section.component));

  return `export const ${mockVar} = {
  title: '${projectName.replace(/([a-z0-9])([A-Z])/g, '$1 $2')}',
  subtitle: '${blueprint.themeDirection}',
  statusItems: [
    { label: 'Updated', value: 'Realtime' },
    { label: 'Mode', value: 'Blueprint' },
  ],
  stats: [
    { label: 'Total', value: 1284, unit: '', delta: 3.2 },
    { label: 'Active', value: 912, unit: '', delta: 1.8 },
    { label: 'Alerts', value: 18, unit: '', delta: -0.6 },
    { label: 'Closed', value: 94.6, unit: '%', delta: 2.1 },
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
    { name: 'North Zone', value: '128 assets' },
    { name: 'Core Hub', value: '32 alerts' },
    { name: 'East Link', value: '84 tasks' },
    { name: 'South Park', value: '96.4%' },
  ],
  mapPoints: [
    { name: 'Hub A', x: 28, y: 34 },
    { name: 'Hub B', x: 64, y: 42 },
    { name: 'Depot C', x: 44, y: 66 },
  ],
  compare: {
    categories: ['North', 'South', 'East', 'West', 'Central'],
    series: [88, 121, 96, 104, 137],
  },
  composition: [
    { name: 'Normal', value: 72 },
    { name: 'Warning', value: 18 },
    { name: 'Critical', value: 10 },
  ],
  ranking: [
    { name: 'Area A', value: 98 },
    { name: 'Area B', value: 91 },
    { name: 'Area C', value: 84 },
    { name: 'Area D', value: 78 },
  ],
  alarms: [
    { time: '09:12', message: 'Cooling station temperature spike', level: 'major' as const },
    { time: '09:18', message: 'Gate access anomaly', level: 'minor' as const },
    { time: '09:24', message: 'Power fluctuation in zone 3', level: 'critical' as const },
  ],
  table: {
    columns: [
      { key: 'name', label: 'Name', width: '1.8fr' },
      { key: 'status', label: 'Status', width: '1fr' },
      { key: 'value', label: 'Value', width: '0.9fr' },
    ],
    rows: [
      { id: 1, name: 'Item 01', status: 'Normal', value: '56.2' },
      { id: 2, name: 'Item 02', status: 'Warning', value: '83.4' },
      { id: 3, name: 'Item 03', status: 'Normal', value: 'Online' },
    ],
  },
  pipeline: [
    { name: 'Stage A', value: 42 },
    { name: 'Stage B', value: 33 },
    { name: 'Stage C', value: 21 },
  ],
  meta: {
    sections: ${JSON.stringify([...needs], null, 2).replace(/\n/g, '\n    ')},
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

export function generateProjectFromBlueprint(blueprint, options = {}) {
  const target = path.resolve(options.target);
  const projectName = options.projectName || blueprint.pageName;
  const starter = path.resolve(__dirname, '..', 'assets', 'starter');
  const slug = toSlug(projectName);

  if (!options.target) {
    throw new Error('target is required');
  }

  copyDir(starter, target);

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
  fs.writeFileSync(path.join(target, 'src', 'mock', `${slug}.ts`), buildMockSource(projectName, blueprint), 'utf8');
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

  const result = generateProjectFromBlueprint(blueprint, {
    target,
    projectName: args.name || blueprint.pageName,
  });

  console.log(`Generated ${result.projectName} at ${result.target}`);
}
