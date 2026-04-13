import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';

import { generateBlueprint, parseRequestInput } from '../scripts/build-blueprint.mjs';

const templateFeaturesPath = path.resolve('bigscreen-generator/references/template-features.json');

test('parseRequestInput normalizes json requests', () => {
  const request = parseRequestInput(
    JSON.stringify({
      domain: 'traffic',
      pageType: 'map-command-page',
      mustHaveSections: ['map', 'alerts', 'ranking'],
      keyMetrics: ['vehicle count', 'incident count'],
      preferredStyle: 'deep blue command center',
      mapRequired: true,
    }),
  );

  assert.equal(request.domain, 'traffic');
  assert.equal(request.pageType, 'map-command-page');
  assert.deepEqual(request.mustHaveSections, ['map', 'alerts', 'ranking']);
  assert.equal(request.mapRequired, true);
});

test('generateBlueprint picks references and components for map command pages', () => {
  const blueprint = generateBlueprint(
    {
      domain: 'traffic',
      pageType: 'map-command-page',
      mustHaveSections: ['map', 'alerts', 'ranking', 'table'],
      keyMetrics: ['vehicle count', 'incident count'],
      preferredStyle: 'deep blue command center',
      mapRequired: true,
      dataDensity: 'high',
    },
    {
      templateFeaturesPath,
      maxReferences: 5,
    },
  );

  assert.equal(blueprint.layoutPattern, 'map-command-page');
  assert.equal(blueprint.referenceTemplates.length, 5);
  assert.ok(blueprint.referenceTemplates.some((item) => item.pageTypes.includes('map-command-page')));
  assert.ok(blueprint.referenceTemplates.some((item) => item.sceneTags.includes('traffic') || item.sceneTags.includes('security')));
  assert.ok(blueprint.sections.some((section) => section.component === 'MapPanel'));
  assert.ok(blueprint.sections.some((section) => section.component === 'AlarmTicker'));
  assert.ok(blueprint.sections.some((section) => section.component === 'RankingList'));
  assert.ok(blueprint.sections.some((section) => section.component === 'ScrollTable'));
});
