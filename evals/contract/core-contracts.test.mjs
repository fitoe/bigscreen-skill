import test from 'node:test';
import assert from 'node:assert/strict';

import { normalizeRequest } from '../../core/request/normalize-request.mjs';
import { buildBlueprint } from '../../core/blueprint/build-blueprint.mjs';
import { buildProjectManifest } from '../../core/manifest/build-project-manifest.mjs';

test('request to blueprint to manifest pipeline normalizes the minimal contract', () => {
  const request = normalizeRequest({
    sourceMode: 'text',
    pageIntent: 'overview home',
    styleDirection: 'deep blue command center',
    requiredModules: ['metric-summary', 'geo-focus', 'data-table'],
  });

  assert.deepEqual(request, {
    sourceMode: 'text',
    pageIntent: 'overview home',
    styleDirection: 'deep blue command center',
    requiredModules: ['metric-summary', 'geo-focus', 'data-table'],
  });

  const blueprint = buildBlueprint(request);

  assert.equal(blueprint.pageName, 'OverviewHome');
  assert.equal(blueprint.layoutPattern, 'overview-home');
  assert.equal(blueprint.themeDirection, 'deep blue command center');
  assert.deepEqual(
    blueprint.sections.map((section) => section.semanticSlot),
    ['metric-summary', 'geo-focus', 'data-table'],
  );
  assert.deepEqual(
    blueprint.sections.map((section) => section.component),
    ['MetricSummarySection', 'GeoFocusSection', 'DataTableSection'],
  );

  const manifest = buildProjectManifest(blueprint);

  assert.equal(manifest.projectName, 'OverviewHome');
  assert.deepEqual(manifest.routes, [
    {
      path: '/',
      pageName: 'OverviewHome',
      component: 'src/views/OverviewHome.vue',
    },
  ]);
  assert.deepEqual(manifest.files, [
    { path: 'package.json', kind: 'config' },
    { path: 'vite.config.ts', kind: 'config' },
    { path: 'src/main.ts', kind: 'entry' },
    { path: 'src/views/OverviewHome.vue', kind: 'view' },
  ]);
});

test('pipeline generates machine-safe section ids for semantic slots with punctuation', () => {
  const request = normalizeRequest({
    sourceMode: 'text',
    pageIntent: 'ops cockpit',
    styleDirection: 'cold blue',
    requiredModules: ['geo focus', 'alert/stream', 'data.table'],
  });

  const blueprint = buildBlueprint(request);

  assert.deepEqual(
    blueprint.sections.map((section) => section.id),
    ['geo-focus-1', 'alert-stream-2', 'data-table-3'],
  );
});

test('buildProjectManifest falls back to a safe default page name for blank input', () => {
  const manifest = buildProjectManifest({
    pageName: '   ',
  });

  assert.equal(manifest.projectName, 'GeneratedPage');
  assert.deepEqual(manifest.routes, [
    {
      path: '/',
      pageName: 'GeneratedPage',
      component: 'src/views/GeneratedPage.vue',
    },
  ]);
  assert.deepEqual(manifest.files, [
    { path: 'package.json', kind: 'config' },
    { path: 'vite.config.ts', kind: 'config' },
    { path: 'src/main.ts', kind: 'entry' },
    { path: 'src/views/GeneratedPage.vue', kind: 'view' },
  ]);
});
