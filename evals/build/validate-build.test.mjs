import test from 'node:test';
import assert from 'node:assert/strict';

import { validateBuild } from '../../validators/build/validate-build.mjs';

test('validateBuild returns build steps for a target path', async () => {
  const result = await validateBuild('C:/tmp/generated-project');

  assert.equal(result.targetPath, 'C:/tmp/generated-project');
  assert.equal(Array.isArray(result.steps), true);
  assert.equal(result.steps.includes('install'), true);
  assert.equal(result.steps.includes('typecheck'), true);
  assert.equal(result.steps.includes('build'), true);
  assert.equal(result.success, true);
});
