import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'bigscreen-validate-'));
}

test('validate-screen-output warns when blueprint quality rules are weak', () => {
  const tempDir = makeTempDir();
  fs.mkdirSync(path.join(tempDir, 'src', 'views'), { recursive: true });
  fs.mkdirSync(path.join(tempDir, 'src', 'components', 'bigscreen', 'charts'), { recursive: true });
  fs.mkdirSync(path.join(tempDir, 'src', 'composables'), { recursive: true });
  fs.mkdirSync(path.join(tempDir, 'src', 'mock'), { recursive: true });
  fs.mkdirSync(path.join(tempDir, 'src', 'api'), { recursive: true });
  fs.mkdirSync(path.join(tempDir, 'src', 'theme'), { recursive: true });
  fs.mkdirSync(path.join(tempDir, 'docs', 'screen-specs'), { recursive: true });

  fs.writeFileSync(path.join(tempDir, 'src', 'views', 'WeakPage.vue'), '<template><div /></template>', 'utf8');
  fs.writeFileSync(path.join(tempDir, 'src', 'router.ts'), '', 'utf8');

  fs.writeFileSync(
    path.join(tempDir, 'docs', 'screen-specs', 'weak-page.blueprint.json'),
    JSON.stringify(
      {
        pageName: 'WeakPage',
        layoutPattern: 'overview-home',
        sections: [
          { purpose: 'trend', area: 'left', heightPolicy: { min: 180, flex: 1 } },
          { purpose: 'compare', area: 'left', heightPolicy: { min: 180, flex: 1 } },
          { purpose: 'composition', area: 'right', heightPolicy: { min: 180, flex: 1 } },
          { purpose: 'ranking', area: 'right', heightPolicy: { min: 180, flex: 1 } },
          { purpose: 'alerts', area: 'side', heightPolicy: { min: 180, flex: 1 } },
          { purpose: 'table', area: 'bottom', heightPolicy: { min: 180, flex: 1, scroll: true } },
        ],
      },
      null,
      2,
    ),
    'utf8',
  );

  const output = execFileSync(
    process.execPath,
    [path.resolve('scripts/validate-screen-output.mjs'), '--target', tempDir],
    { stdio: 'pipe', encoding: 'utf8' },
  );

  assert.match(output, /Validation passed/);
  assert.match(output, /Missing blueprint blockPriority metadata/);
  assert.match(output, /Bottom table height is low/);
  assert.match(output, /Right-side summary zone is too dense/);
});
