import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

test('revise-screen regenerates a project from a blueprint revision', () => {
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
  fs.writeFileSync(revisionFile, '右侧摘要区改成排行和构成');

  const reviseResult = spawnSync(
    'node',
    ['scripts/revise-screen.mjs', '--blueprint-file', blueprintFile, '--revision-file', revisionFile, '--target', tempDir],
    { encoding: 'utf8', env: { ...process.env, BIGSCREEN_SKIP_UX: '1' } },
  );

  assert.equal(reviseResult.status, 0);
  assert.equal(fs.existsSync(path.join(tempDir, 'index.html')), true);
  assert.equal(fs.existsSync(path.join(tempDir, 'src', 'main.ts')), true);
  assert.equal(fs.existsSync(path.join(tempDir, 'docs', 'screen-specs')), true);
});
