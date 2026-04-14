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

test('revision semantics applies add remove replace and emits revision report', () => {
  const { blueprint, report } = applyRevisionSemantics(baseBlueprint, '去掉地图，加排行和构成，表格改成告警');

  const slots = blueprint.sections.map((section) => section.semanticSlot);
  assert.equal(slots.includes('geo-focus'), false);
  assert.equal(slots.includes('ranking-list'), true);
  assert.equal(slots.includes('composition-chart'), true);
  assert.equal(slots.includes('alert-stream'), true);
  assert.equal(slots.includes('data-table'), false);

  assert.ok(report.added.includes('ranking-list'));
  assert.ok(report.added.includes('composition-chart'));
  assert.ok(report.removed.includes('geo-focus'));
  assert.ok(report.replaced.some((entry) => entry.from === 'data-table' && entry.to === 'alert-stream'));
  assert.deepEqual(Object.keys(report), ['added', 'removed', 'replaced', 'adjustments', 'conflicts', 'unmapped']);
  assert.ok(Array.isArray(report.adjustments));
  assert.ok(Array.isArray(report.conflicts));
  assert.ok(Array.isArray(report.unmapped));
  assert.deepEqual(blueprint.revisionReport, report);
});

test('replacement of the main visual promotes the replacement slot', () => {
  const { blueprint, report } = applyRevisionSemantics(baseBlueprint, '地图改成告警');
  const alert = blueprint.sections.find((section) => section.semanticSlot === 'alert-stream');
  assert.ok(alert);
  assert.equal(alert.priority, 101);
  assert.ok(report.adjustments.some((entry) => entry.type === 'promote-main-visual' && entry.slot === 'alert-stream'));
});

test('last occurrence wins for conflicting add and remove', () => {
  const { blueprint, report } = applyRevisionSemantics(baseBlueprint, '不要地图，但是加地图');

  assert.ok(blueprint.sections.some((section) => section.semanticSlot === 'geo-focus'));
  assert.ok(report.conflicts.some((entry) => entry.slot === 'geo-focus' && entry.resolution === 'add'));
});

test('deleting the main visual falls back to the next priority slot', () => {
  const tinyBlueprint = {
    ...baseBlueprint,
    sections: [{ id: 'geo-focus-1', semanticSlot: 'geo-focus', component: 'GeoFocusSection', priority: 100 }],
  };

  const { blueprint, report } = applyRevisionSemantics(tinyBlueprint, '删除地图');
  const slots = blueprint.sections.map((section) => section.semanticSlot);

  assert.equal(slots.includes('geo-focus'), false);
  assert.ok(slots.includes('trend-chart'));
  assert.equal(blueprint.sections.find((section) => section.semanticSlot === 'trend-chart').priority, 101);
  assert.ok(report.adjustments.some((entry) => entry.type === 'promote-main-visual' && entry.slot === 'trend-chart'));
});

test('fallback slots follow the documented order when filling gaps', () => {
  const base = {
    ...baseBlueprint,
    sections: [{ id: 'trend-chart-1', semanticSlot: 'trend-chart', component: 'TrendChartSection', priority: 100 }],
  };

  const { blueprint } = applyRevisionSemantics(base, '删除趋势');
  const slots = blueprint.sections.map((section) => section.semanticSlot);

  assert.ok(slots.includes('composition-chart'));
  assert.equal(slots.includes('trend-chart'), false);
});

test('fallback order reaches ranking-list when higher fallbacks are removed', () => {
  const base = {
    ...baseBlueprint,
    sections: [
      { id: 'trend-chart-1', semanticSlot: 'trend-chart', component: 'TrendChartSection', priority: 100 },
      { id: 'composition-chart-2', semanticSlot: 'composition-chart', component: 'CompositionChartSection', priority: 95 },
    ],
  };

  const { blueprint } = applyRevisionSemantics(base, '删除趋势，删除构成');
  const slots = blueprint.sections.map((section) => section.semanticSlot);

  assert.ok(slots.includes('ranking-list'));
  assert.equal(slots.includes('trend-chart'), false);
  assert.equal(slots.includes('composition-chart'), false);
});

test('fallback inserts trend-chart when available', () => {
  const base = {
    ...baseBlueprint,
    sections: [
      { id: 'data-table-1', semanticSlot: 'data-table', component: 'DataTableSection', priority: 90 },
      { id: 'ranking-list-2', semanticSlot: 'ranking-list', component: 'RankingListSection', priority: 80 },
    ],
  };

  const { blueprint } = applyRevisionSemantics(base, '删除排行');
  const slots = blueprint.sections.map((section) => section.semanticSlot);

  assert.ok(slots.includes('trend-chart'));
});

test('no-op add/remove do not create report entries', () => {
  const { report } = applyRevisionSemantics(baseBlueprint, '删除不存在的模块，添加地图');

  assert.equal(report.removed.includes('geo-focus'), false);
  assert.equal(report.added.includes('geo-focus'), false);
});

test('english keywords are recognized case-insensitively', () => {
  const { blueprint, report } = applyRevisionSemantics(baseBlueprint, 'Remove Map, Add Ranking');
  const slots = blueprint.sections.map((section) => section.semanticSlot);
  assert.equal(slots.includes('geo-focus'), false);
  assert.equal(slots.includes('ranking-list'), true);
  assert.ok(report.removed.includes('geo-focus'));
  assert.ok(report.added.includes('ranking-list'));
});

test('single-section blueprint without removals does not auto-fill fallbacks', () => {
  const base = {
    ...baseBlueprint,
    sections: [{ id: 'geo-focus-1', semanticSlot: 'geo-focus', component: 'GeoFocusSection', priority: 100 }],
  };

  const { blueprint, report } = applyRevisionSemantics(base, '调整字体大小');
  const slots = blueprint.sections.map((section) => section.semanticSlot);

  assert.deepEqual(slots, ['geo-focus']);
  assert.equal(report.added.length, 0);
});
