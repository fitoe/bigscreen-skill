import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';

import { buildValidationOutputDir, evaluateBrowserSnapshot } from '../scripts/playwright-validate-screen.mjs';

test('evaluateBrowserSnapshot reports generic layout failures', () => {
  const result = evaluateBrowserSnapshot(
    {
      pageFitsViewport: false,
      verticalScrollbar: true,
      horizontalScrollbar: false,
      outOfBoundsPanels: [{ left: -4 }],
      minFontSize: 11,
      tableVisibleRows: [{ rows: 2 }],
      largestRole: 'scroll-table',
      roleCounts: {},
      roleZones: {},
      bandRoles: { left: [], center: [], right: [], bottom: [] },
      panelChrome: 'tech-frame',
    },
    { blockPriority: ['map'] },
    null,
  );

  assert.equal(result.status, 'fail');
  assert.match(result.findings.join('\n'), /full-screen fit failed/);
  assert.match(result.findings.join('\n'), /vertical scrolling/);
  assert.match(result.findings.join('\n'), /font size is too low/);
  assert.match(result.findings.join('\n'), /too few visible rows/);
});

test('evaluateBrowserSnapshot compares reference-driven expectations', () => {
  const result = evaluateBrowserSnapshot(
    {
      pageFitsViewport: true,
      verticalScrollbar: false,
      horizontalScrollbar: false,
      outOfBoundsPanels: [],
      minFontSize: 14,
      tableVisibleRows: [{ rows: 5 }],
      largestRole: 'map-panel',
      roleCounts: { 'map-panel': 1, 'scroll-table': 1 },
      roleZones: { 'map-panel': 'left', 'scroll-table': 'middle' },
      bandRoles: { left: ['map-panel'], center: [], right: [], bottom: [] },
      panelChrome: 'grid-frame',
    },
    { blockPriority: ['map'] },
    {
      structuredPrompt: {
        mustModules: ['map', 'table'],
        layoutNarrative: ['中间主视觉是地图', '底部保留表格'],
        panelChrome: { variant: 'command-angled' },
      },
    },
  );

  assert.equal(result.status, 'warn');
  assert.match(result.warnings.join('\n'), /Panel chrome differs/);
  assert.match(result.warnings.join('\n'), /map is not centered/);
  assert.match(result.warnings.join('\n'), /table is not placed at the bottom/);
});

test('buildValidationOutputDir defaults to system temp artifacts directory', () => {
  const target = path.resolve('tmp', 'demo-screen');
  const outputDir = buildValidationOutputDir({ target });

  assert.match(outputDir, new RegExp(`${path.join(os.tmpdir(), 'bigscreen-skill').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
  assert.match(outputDir, /playwright-artifacts/);
  assert.doesNotMatch(outputDir, /docs[\\/]+screen-specs/);
});
