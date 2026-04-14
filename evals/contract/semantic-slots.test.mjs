import test from 'node:test';
import assert from 'node:assert/strict';

import { semanticSlotRegistry } from '../../generators/registry/semantic-slots.mjs';

test('semantic slot registry declares the expected contract surface', () => {
  const expectedRegistry = {
    'metric-summary': { componentFamily: 'MetricSummarySection' },
    'trend-chart': { componentFamily: 'TrendChartSection' },
    'geo-focus': { componentFamily: 'GeoFocusSection' },
    'ranking-list': { componentFamily: 'RankingListSection' },
    'alert-stream': { componentFamily: 'AlertStreamSection' },
    'composition-chart': { componentFamily: 'CompositionChartSection' },
    'data-table': { componentFamily: 'DataTableSection' },
  };

  assert.deepEqual(semanticSlotRegistry, expectedRegistry);

  for (const [slot, entry] of Object.entries(semanticSlotRegistry)) {
    assert.equal(typeof slot, 'string');
    assert.equal(typeof entry, 'object');
    assert.ok(entry && !Array.isArray(entry));
    assert.deepEqual(Object.keys(entry), ['componentFamily']);
    assert.equal(typeof entry.componentFamily, 'string');
  }
});
