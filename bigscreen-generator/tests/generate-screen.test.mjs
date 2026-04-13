import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'bigscreen-screen-'));
}

test('generate-screen script writes project and blueprint artifacts', () => {
  const tempDir = makeTempDir();
  execFileSync(
    process.execPath,
    [
      path.resolve('bigscreen-generator/scripts/generate-screen.mjs'),
      '--request-file',
      path.resolve('bigscreen-generator/tests/fixtures/traffic-map-command.request.json'),
      '--target',
      tempDir,
      '--name',
      'TrafficCommandCenter',
    ],
    { stdio: 'pipe' },
  );

  assert.ok(fs.existsSync(path.join(tempDir, 'src', 'views', 'TrafficCommandCenter.vue')));
  assert.ok(fs.existsSync(path.join(tempDir, 'docs', 'screen-specs', 'traffic-command-center.blueprint.json')));
  assert.ok(fs.existsSync(path.join(tempDir, 'docs', 'screen-specs', 'traffic-command-center.blueprint.md')));
});
