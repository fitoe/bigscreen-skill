import test from 'node:test';
import assert from 'node:assert/strict';

import { applyBlueprintPolicies } from '../../core/policies/apply-blueprint-policies.mjs';
import { applyManifestPolicies } from '../../core/policies/apply-manifest-policies.mjs';

test('applyBlueprintPolicies backfills required slots and preserves overrides', () => {
  const blueprint = applyBlueprintPolicies({
    pageName: 'GeneratedOverview',
    pagePolicy: {
      viewportLocked: false,
      pageTheme: 'dark',
    },
    sectionPolicies: {
      'composition-chart': {
        legendMode: 'manual',
        customLegend: true,
      },
      'custom-slot': {
        enabled: true,
      },
    },
  });

  assert.deepEqual(blueprint.pagePolicy, {
    viewportLocked: true,
    pageTheme: 'dark',
    noPageScroll: true,
  });
  assert.deepEqual(blueprint.sectionPolicies['composition-chart'], {
    legendMode: 'manual',
    customLegend: true,
  });
  assert.deepEqual(blueprint.sectionPolicies['data-table'], {
    minVisibleRows: 5,
  });
  assert.deepEqual(blueprint.sectionPolicies['geo-focus'], {
    centerMap: true,
  });
  assert.deepEqual(blueprint.sectionPolicies['custom-slot'], {
    enabled: true,
  });
});

test('applyBlueprintPolicies normalizes required section policies even without sections', () => {
  const blueprint = applyBlueprintPolicies({
    sections: [],
  });

  assert.deepEqual(Object.keys(blueprint.sectionPolicies).sort(), [
    'composition-chart',
    'data-table',
    'geo-focus',
  ]);
});

test('applyManifestPolicies backfills build flags and preserves unrelated policy fields', () => {
  const manifest = applyManifestPolicies({
    projectName: 'GeneratedOverview',
    buildPolicies: {
      install: false,
      lint: true,
      build: false,
    },
  });

  assert.deepEqual(manifest.buildPolicies, {
    install: true,
    lint: true,
    typecheck: true,
    build: true,
  });
});
