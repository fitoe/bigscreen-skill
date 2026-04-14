import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'bigscreen-image-spec-'));
}

test('generate-screen-from-image-spec creates project and prompt package artifacts', () => {
  const tempDir = makeTempDir();

  execFileSync(
    process.execPath,
    [
      path.resolve('bigscreen-generator/scripts/generate-screen-from-image-spec.mjs'),
      '--input-file',
      path.resolve('bigscreen-generator/tests/fixtures/inclusive-finance-image-spec.json'),
      '--target',
      tempDir,
      '--name',
      'InclusiveFinanceOverview',
    ],
    { stdio: 'pipe' },
  );

  assert.ok(fs.existsSync(path.join(tempDir, 'src', 'views', 'InclusiveFinanceOverview.vue')));
  assert.ok(fs.existsSync(path.join(tempDir, 'docs', 'screen-specs', 'inclusive-finance-overview.image-prompt.json')));
  assert.ok(fs.existsSync(path.join(tempDir, 'docs', 'screen-specs', 'inclusive-finance-overview.blueprint.json')));
});
