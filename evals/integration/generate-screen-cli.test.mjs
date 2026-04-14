import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

test('generate-screen CLI uses the manifest-first pipeline', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bigscreen-cli-'));
  const requestFile = path.join(tempDir, 'request.json');

  fs.writeFileSync(
    requestFile,
    JSON.stringify({
      sourceMode: 'text',
      pageIntent: 'overview',
      styleDirection: 'deep blue',
      requiredModules: ['metric-summary', 'geo-focus', 'data-table'],
    }),
  );

  const result = spawnSync(
    'node',
    ['scripts/generate-screen.mjs', '--request-file', requestFile, '--target', tempDir, '--name', 'GeneratedOverview'],
    { encoding: 'utf8' },
  );

  assert.equal(result.status, 0);
  assert.equal(fs.existsSync(path.join(tempDir, 'index.html')), true);
  assert.equal(fs.existsSync(path.join(tempDir, 'package.json')), true);
  assert.equal(fs.existsSync(path.join(tempDir, 'vite.config.ts')), true);
  assert.equal(fs.existsSync(path.join(tempDir, 'src', 'main.ts')), true);
  assert.equal(fs.existsSync(path.join(tempDir, 'src', 'router', 'index.ts')), true);
  assert.equal(fs.existsSync(path.join(tempDir, 'src', 'views', 'Overview.vue')), true);
  assert.equal(fs.existsSync(path.join(tempDir, 'docs', 'screen-specs', 'Overview.blueprint.json')), true);
  assert.equal(fs.existsSync(path.join(tempDir, 'docs', 'screen-specs', 'Overview.manifest.json')), true);
});
