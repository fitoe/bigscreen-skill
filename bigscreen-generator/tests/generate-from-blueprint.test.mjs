import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { generateProjectFromBlueprint } from '../scripts/generate-from-blueprint.mjs';

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'bigscreen-gen-'));
}

test('generateProjectFromBlueprint scaffolds files from blueprint', () => {
  const tempDir = makeTempDir();
  const blueprint = {
    pageName: 'MapCommandPage',
    goal: 'Support traffic dashboards for map-command-page.',
    layoutPattern: 'map-command-page',
    themeDirection: 'deep blue command center',
    blockPriority: ['map', 'alerts', 'table'],
    heightStrategy: {
      overall: 'Keep map and bottom operational rail visible above the fold.',
      notes: ['Reserve larger height for map and bottom table.'],
    },
    referenceTemplates: [
      {
        id: '034 晋城高速综合管控大数据',
        templateName: '晋城高速综合管控大数据',
        sceneTags: ['traffic'],
        pageTypes: ['map-command-page'],
        chartFamilies: ['line', 'bar', 'pie'],
        score: 10,
      },
    ],
    sections: [
      { id: 'StatCard-1', area: 'top', component: 'StatCard', purpose: 'kpi', priority: 70, heightPolicy: { fixed: false, min: 120, flex: 0.8, scroll: false, autoRotate: false }, dataContract: { type: 'metric-list', keys: ['vehicle count'] } },
      { id: 'MapPanel-2', area: 'center', component: 'MapPanel', purpose: 'map', priority: 100, heightPolicy: { fixed: false, min: 360, flex: 1.8, scroll: false, autoRotate: false }, dataContract: { type: 'map-payload', keys: ['regions', 'points'] } },
      { id: 'AlarmTicker-3', area: 'bottom', component: 'AlarmTicker', purpose: 'alerts', priority: 92, heightPolicy: { fixed: false, min: 220, flex: 1.1, scroll: true, autoRotate: true }, dataContract: { type: 'event-stream', keys: ['time', 'level', 'message'] } },
      { id: 'ScrollTable-4', area: 'bottom', component: 'ScrollTable', purpose: 'table', priority: 90, heightPolicy: { fixed: false, min: 260, flex: 1.35, scroll: true, autoRotate: true }, dataContract: { type: 'row-list', keys: ['id', 'name', 'status', 'value'] } },
    ],
  };

  generateProjectFromBlueprint(blueprint, {
    target: tempDir,
    projectName: 'TrafficCommandCenter',
  });

  assert.ok(fs.existsSync(path.join(tempDir, 'src', 'views', 'TrafficCommandCenter.vue')));
  assert.ok(fs.existsSync(path.join(tempDir, 'src', 'composables', 'useTrafficCommandCenter.ts')));
  assert.ok(fs.existsSync(path.join(tempDir, 'src', 'mock', 'traffic-command-center.ts')));
  assert.ok(fs.existsSync(path.join(tempDir, 'docs', 'screen-specs', 'traffic-command-center.md')));

  const viewSource = fs.readFileSync(path.join(tempDir, 'src', 'views', 'TrafficCommandCenter.vue'), 'utf8');
  assert.match(viewSource, /MapPanel/);
  assert.match(viewSource, /AlarmTicker/);
  assert.match(viewSource, /ScrollTable/);

  const docSource = fs.readFileSync(path.join(tempDir, 'docs', 'screen-specs', 'traffic-command-center.md'), 'utf8');
  assert.match(docSource, /Reference Templates/);
  assert.match(docSource, /晋城高速综合管控大数据/);
  assert.match(docSource, /Block Priority/);
  assert.match(docSource, /Height Strategy/);
});

test('generateProjectFromBlueprint uses grouped layout wrappers for alarm center pages', () => {
  const tempDir = makeTempDir();
  const blueprint = {
    pageName: 'AlarmCenterPage',
    goal: 'Support alarm triage dashboards.',
    layoutPattern: 'alarm-center',
    themeDirection: 'dark alert command center',
    referenceTemplates: [],
    sections: [
      { id: 'StatCard-1', area: 'top', component: 'StatCard', purpose: 'kpi', dataContract: { type: 'metric-list', keys: ['alarm count'] } },
      { id: 'LineTrendChart-2', area: 'left', component: 'LineTrendChart', purpose: 'alarm trend', dataContract: { type: 'chart-series', keys: ['categories', 'series'] } },
      { id: 'PieRingChart-3', area: 'right', component: 'PieRingChart', purpose: 'alarm composition', dataContract: { type: 'chart-series', keys: ['items'] } },
      { id: 'AlarmTicker-4', area: 'center', component: 'AlarmTicker', purpose: 'alerts', dataContract: { type: 'event-stream', keys: ['time', 'level', 'message'] } },
      { id: 'ScrollTable-5', area: 'bottom', component: 'ScrollTable', purpose: 'table', dataContract: { type: 'row-list', keys: ['id', 'name', 'status', 'value'] } },
    ],
  };

  generateProjectFromBlueprint(blueprint, {
    target: tempDir,
    projectName: 'AlarmCenterPage',
  });

  const viewSource = fs.readFileSync(path.join(tempDir, 'src', 'views', 'AlarmCenterPage.vue'), 'utf8');
  assert.match(viewSource, /class="hero-grid hero-grid--alarm-center"/);
  assert.match(viewSource, /class="hero-column hero-column--left"/);
  assert.match(viewSource, /class="hero-column hero-column--center"/);
  assert.match(viewSource, /class="hero-column hero-column--right"/);
  assert.match(viewSource, /title="Alarm Trend"/);
  assert.match(viewSource, /title="Alarm Composition"/);
});

test('generateProjectFromBlueprint creates section components for PanelCard sections', () => {
  const tempDir = makeTempDir();
  const blueprint = {
    pageName: 'OverviewHome',
    goal: 'Overview page',
    layoutPattern: 'overview-home',
    themeDirection: 'deep blue',
    referenceTemplates: [],
    sections: [
      { id: 'PanelCard-1', area: 'left', component: 'PanelCard', purpose: 'custom workload', dataContract: { type: 'chart-series', keys: ['categories', 'series'] } },
      { id: 'PanelCard-2', area: 'right', component: 'PanelCard', purpose: 'custom composition', dataContract: { type: 'chart-series', keys: ['items'] } },
    ],
  };

  generateProjectFromBlueprint(blueprint, {
    target: tempDir,
    projectName: 'OverviewHome',
  });

  const componentPath = path.join(tempDir, 'src', 'components', 'bigscreen', 'sections', 'SectionCustomWorkload.vue');
  assert.ok(fs.existsSync(componentPath));
});

test('generated starter components include fixed header and carousel-ready behaviors', () => {
  const tempDir = makeTempDir();
  const blueprint = {
    pageName: 'OverviewHome',
    goal: 'Overview page',
    layoutPattern: 'overview-home',
    themeDirection: 'deep blue',
    blockPriority: ['trend', 'table'],
    heightStrategy: { overall: 'Keep primary trend and table visible.', notes: [] },
    referenceTemplates: [],
    sections: [
      { id: 'StatCard-1', area: 'top', component: 'StatCard', purpose: 'kpi', priority: 70, heightPolicy: { fixed: false, min: 120, flex: 0.8, scroll: false, autoRotate: false }, dataContract: { type: 'metric-list', keys: ['online'] } },
    ],
  };

  generateProjectFromBlueprint(blueprint, {
    target: tempDir,
    projectName: 'OverviewHome',
  });

  const tableSource = fs.readFileSync(path.join(tempDir, 'src', 'components', 'bigscreen', 'ScrollTable.vue'), 'utf8');
  const alarmSource = fs.readFileSync(path.join(tempDir, 'src', 'components', 'bigscreen', 'AlarmTicker.vue'), 'utf8');
  const rankingSource = fs.readFileSync(path.join(tempDir, 'src', 'components', 'bigscreen', 'RankingList.vue'), 'utf8');

  assert.match(tableSource, /table-head/);
  assert.match(tableSource, /body-viewport/);
  assert.match(tableSource, /pauseOnHover/);
  assert.match(alarmSource, /pauseOnHover/);
  assert.match(rankingSource, /pauseOnHover/);
});

test('generated mock data follows semantic profile instead of fixed industry labels', () => {
  const tempDir = makeTempDir();
  const blueprint = {
    pageName: 'ServiceOverview',
    goal: 'Support generic service dashboards.',
    layoutPattern: 'overview-home',
    themeDirection: 'cold blue operations center',
    blockPriority: ['trend', 'table'],
    heightStrategy: { overall: 'Keep service trend and ledger visible.', notes: [] },
    layoutDirectives: { heroSection: 'trend', avoidEqualSplit: true },
    semanticProfile: {
      entity: { singular: 'User', plural: 'Users' },
      metrics: ['活跃用户', '异常工单', '处理时效', '满意度'],
      eventLabel: 'User Events',
      tableLabel: 'Users Ledger',
      tableColumns: [
        { key: 'name', label: 'User', width: '1.8fr' },
        { key: 'status', label: 'Status', width: '1fr' },
        { key: 'value', label: '异常工单', width: '1fr' },
      ],
      stateSet: ['Online', 'Busy', 'Offline'],
      rankingNames: ['Tier A', 'Tier B', 'Tier C', 'Tier D'],
      mapRegions: ['North Hub', 'Central Grid', 'South Cluster', 'West Loop'],
      mapPoints: ['Node A', 'Node B', 'Node C'],
      stageNames: ['Queue', 'Handling', 'Review', 'Close'],
    },
    referenceTemplates: [],
    sections: [
      { id: 'StatCard-1', area: 'top', component: 'StatCard', purpose: 'kpi', priority: 70, heightPolicy: { fixed: false, min: 120, flex: 0.8, scroll: false, autoRotate: false }, dataContract: { type: 'metric-list', keys: ['活跃用户'] } },
      { id: 'LineTrendChart-2', area: 'center', component: 'LineTrendChart', purpose: 'trend', priority: 90, heightPolicy: { fixed: false, min: 240, flex: 1.2, scroll: false, autoRotate: false }, dataContract: { type: 'chart-series', keys: ['categories', 'series'] } },
      { id: 'ScrollTable-3', area: 'bottom', component: 'ScrollTable', purpose: 'table', priority: 92, heightPolicy: { fixed: false, min: 260, flex: 1.35, scroll: true, autoRotate: true }, dataContract: { type: 'row-list', keys: ['id', 'name', 'status', 'value'] } },
    ],
  };

  generateProjectFromBlueprint(blueprint, {
    target: tempDir,
    projectName: 'ServiceOverview',
  });

  const mockSource = fs.readFileSync(path.join(tempDir, 'src', 'mock', 'service-overview.ts'), 'utf8');
  assert.match(mockSource, /活跃用户/);
  assert.match(mockSource, /User 01/);
  assert.match(mockSource, /异常工单/);
  assert.doesNotMatch(mockSource, /Cooling station temperature spike/);
});
