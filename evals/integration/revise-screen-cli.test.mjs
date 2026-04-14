import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

test('revise-screen applies add/remove/replace semantics', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bigscreen-revise-'));
  const requestFile = path.join(tempDir, 'request.json');
  const blueprintFile = path.join(tempDir, 'base.blueprint.json');
  const revisionFile = path.join(tempDir, 'revision.txt');

  fs.writeFileSync(
    requestFile,
    JSON.stringify({
      sourceMode: 'text',
      pageIntent: 'overview',
      styleDirection: 'deep blue',
      requiredModules: ['metric-summary', 'geo-focus', 'data-table'],
    }),
  );

  const buildResult = spawnSync(
    'node',
    ['scripts/build-blueprint.mjs', '--request-file', requestFile, '--format', 'json', '--output', blueprintFile],
    { encoding: 'utf8' },
  );

  assert.equal(buildResult.status, 0);
  fs.writeFileSync(revisionFile, '去掉地图，加排行和构成，表格改成告警');

  const reviseResult = spawnSync(
    'node',
    ['scripts/revise-screen.mjs', '--blueprint-file', blueprintFile, '--revision-file', revisionFile, '--target', tempDir],
    { encoding: 'utf8', env: { ...process.env, BIGSCREEN_SKIP_UX: '1' } },
  );

  assert.equal(reviseResult.status, 0);

  const revised = JSON.parse(fs.readFileSync(path.join(tempDir, 'docs', 'screen-specs', 'Overview.blueprint.json'), 'utf8'));
  const slots = revised.sections.map((section) => section.semanticSlot);

  assert.equal(slots.includes('geo-focus'), false);
  assert.equal(slots.includes('ranking-list'), true);
  assert.equal(slots.includes('composition-chart'), true);
  assert.equal(slots.includes('alert-stream'), true);
  assert.equal(slots.includes('data-table'), false);
});
