import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

function read(file) {
  return fs.readFileSync(path.resolve(file), 'utf8');
}

test('playwright-capable generation scripts enable temporary artifact cleanup by default', () => {
  const generateScreen = read('scripts/generate-screen.mjs');
  const generateFromImage = read('scripts/generate-screen-from-image-spec.mjs');
  const reviseScreen = read('scripts/revise-screen.mjs');

  assert.match(generateScreen, /validatorArgs\.push\('--cleanup'\)/);
  assert.match(generateFromImage, /validatorArgs\.push\('--cleanup'\)/);
  assert.match(reviseScreen, /validatorArgs\.push\('--cleanup'\)/);
});
