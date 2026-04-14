import test from 'node:test';
import assert from 'node:assert/strict';

import { validateUx } from '../../validators/ux/validate-ux.mjs';

test('validateUx builds a playwright command without executing when dryRun is set', () => {
  const result = validateUx('C:/tmp/generated-project', {
    referenceSpecFile: 'C:/tmp/blueprint.json',
    referenceImage: 'C:/tmp/reference.png',
    outputDir: 'C:/tmp/artifacts',
    dryRun: true,
  });

  assert.equal(result.command, process.execPath);
  assert.ok(result.args.includes('--install-deps'));
  assert.ok(result.args.includes('--cleanup'));
  assert.ok(result.args.includes('C:/tmp/generated-project'));
});
