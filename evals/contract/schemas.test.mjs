import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const testDir = path.dirname(fileURLToPath(import.meta.url));

const requiredSchemas = [
  {
    file: '../../schemas/request.schema.json',
    required: ['sourceMode', 'pageIntent', 'styleDirection'],
    properties: {
      sourceMode: { type: 'string', enum: ['text', 'image', 'revision'] },
      pageIntent: { type: 'string' },
      styleDirection: { type: 'string' },
    },
  },
  {
    file: '../../schemas/blueprint.schema.json',
    required: ['pageName', 'layoutPattern', 'sections'],
    properties: {
      pageName: { type: 'string' },
      layoutPattern: { type: 'string' },
      sections: { type: 'array', items: { type: 'object' } },
    },
  },
  {
    file: '../../schemas/project-manifest.schema.json',
    required: ['projectName', 'routes', 'files'],
    properties: {
      projectName: { type: 'string' },
      routes: { type: 'array', items: { type: 'object' } },
      files: { type: 'array', items: { type: 'object' } },
    },
  },
  {
    file: '../../schemas/screen-output.schema.json',
    required: ['targetPath', 'generatedFiles'],
    properties: {
      targetPath: { type: 'string' },
      generatedFiles: { type: 'array', items: { type: 'string' } },
    },
  },
];

test('phase 1 schemas declare object roots and minimal contracts', () => {
  for (const schemaSpec of requiredSchemas) {
    const source = fs.readFileSync(path.resolve(testDir, schemaSpec.file), 'utf8');
    const schema = JSON.parse(source);
    assert.equal(schema.type, 'object');
    assert.ok(schema.$id);
    assert.ok(schema.$schema);
    assert.equal(schema.additionalProperties, false);
    assert.deepEqual(schema.required, schemaSpec.required);
    assert.deepEqual(Object.keys(schema.properties).sort(), Object.keys(schemaSpec.properties).sort());
    for (const [propertyName, propertySpec] of Object.entries(schemaSpec.properties)) {
      assert.deepEqual(schema.properties[propertyName], propertySpec);
    }
  }
});
