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

  const promptArtifact = JSON.parse(
    fs.readFileSync(path.join(tempDir, 'docs', 'screen-specs', 'inclusive-finance-overview.image-prompt.json'), 'utf8'),
  );
  assert.ok(Array.isArray(promptArtifact.imageAnalysisSummary));
  assert.match(promptArtifact.imageAnalysisSummary.join('\n'), /生成策略：保留布局节奏与模块外壳/);
});
