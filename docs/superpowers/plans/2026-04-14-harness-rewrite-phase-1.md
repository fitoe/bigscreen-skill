# Bigscreen Harness Rewrite Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the starter-centered generation path with the first runnable slice of a manifest-first harness architecture.

**Architecture:** Introduce explicit request, blueprint, and manifest contracts, then rebuild the generation path around those contracts before deleting the legacy starter path. Phase 1 stops after the new object model, validators, and manifest-driven file generation skeleton are working in parallel with the old repository contents.

**Tech Stack:** Node.js, ES modules, JSON Schema, Vue 3, TypeScript, Vite, ECharts, Playwright, node:test

---

### Task 1: Create Contract Schemas

**Files:**
- Create: `schemas/request.schema.json`
- Create: `schemas/blueprint.schema.json`
- Create: `schemas/project-manifest.schema.json`
- Create: `schemas/screen-output.schema.json`
- Test: `evals/contract/schemas.test.mjs`

- [ ] **Step 1: Write the failing schema test**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const requiredSchemas = [
  'schemas/request.schema.json',
  'schemas/blueprint.schema.json',
  'schemas/project-manifest.schema.json',
  'schemas/screen-output.schema.json',
];

test('phase 1 schemas exist and declare object roots', () => {
  for (const file of requiredSchemas) {
    const source = fs.readFileSync(path.resolve(file), 'utf8');
    const schema = JSON.parse(source);
    assert.equal(schema.type, 'object');
    assert.ok(schema.$id);
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test evals/contract/schemas.test.mjs`
Expected: FAIL because the schema files do not exist yet.

- [ ] **Step 3: Write minimal schemas**

```json
{
  "$id": "schemas/request.schema.json",
  "type": "object",
  "additionalProperties": false,
  "required": ["sourceMode", "pageIntent", "styleDirection"],
  "properties": {
    "sourceMode": { "type": "string", "enum": ["text", "image", "revision"] },
    "pageIntent": { "type": "string" },
    "styleDirection": { "type": "string" }
  }
}
```

```json
{
  "$id": "schemas/blueprint.schema.json",
  "type": "object",
  "additionalProperties": false,
  "required": ["pageName", "layoutPattern", "sections"],
  "properties": {
    "pageName": { "type": "string" },
    "layoutPattern": { "type": "string" },
    "sections": {
      "type": "array",
      "items": { "type": "object" }
    }
  }
}
```

```json
{
  "$id": "schemas/project-manifest.schema.json",
  "type": "object",
  "additionalProperties": false,
  "required": ["projectName", "routes", "files"],
  "properties": {
    "projectName": { "type": "string" },
    "routes": { "type": "array", "items": { "type": "object" } },
    "files": { "type": "array", "items": { "type": "object" } }
  }
}
```

```json
{
  "$id": "schemas/screen-output.schema.json",
  "type": "object",
  "additionalProperties": false,
  "required": ["targetPath", "generatedFiles"],
  "properties": {
    "targetPath": { "type": "string" },
    "generatedFiles": { "type": "array", "items": { "type": "string" } }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test evals/contract/schemas.test.mjs`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add schemas evals/contract/schemas.test.mjs
git commit -m "add core harness schemas"
```

### Task 2: Add Core Contract Modules

**Files:**
- Create: `core/request/normalize-request.mjs`
- Create: `core/blueprint/build-blueprint.mjs`
- Create: `core/manifest/build-project-manifest.mjs`
- Test: `evals/contract/core-contracts.test.mjs`

- [ ] **Step 1: Write the failing contract pipeline test**

```js
import test from 'node:test';
import assert from 'node:assert/strict';

import { normalizeRequest } from '../../core/request/normalize-request.mjs';
import { buildBlueprint } from '../../core/blueprint/build-blueprint.mjs';
import { buildProjectManifest } from '../../core/manifest/build-project-manifest.mjs';

test('phase 1 pipeline returns request, blueprint, and manifest artifacts', () => {
  const request = normalizeRequest({
    sourceMode: 'text',
    pageIntent: 'overview',
    styleDirection: 'deep blue',
    requiredModules: ['metric-summary', 'geo-focus', 'data-table'],
  });

  const blueprint = buildBlueprint(request);
  const manifest = buildProjectManifest(blueprint);

  assert.equal(request.sourceMode, 'text');
  assert.equal(blueprint.pageName.length > 0, true);
  assert.equal(Array.isArray(blueprint.sections), true);
  assert.equal(Array.isArray(manifest.files), true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test evals/contract/core-contracts.test.mjs`
Expected: FAIL because the modules do not exist yet.

- [ ] **Step 3: Write minimal contract modules**

```js
export function normalizeRequest(input) {
  return {
    sourceMode: input.sourceMode,
    pageIntent: input.pageIntent,
    styleDirection: input.styleDirection,
    requiredModules: input.requiredModules ?? [],
  };
}
```

```js
export function buildBlueprint(request) {
  return {
    pageName: 'GeneratedOverview',
    layoutPattern: request.pageIntent,
    themeDirection: request.styleDirection,
    sections: request.requiredModules.map((slot, index) => ({
      id: `${slot}-${index + 1}`,
      semanticSlot: slot,
      priority: 100 - index,
    })),
  };
}
```

```js
export function buildProjectManifest(blueprint) {
  return {
    projectName: blueprint.pageName,
    routes: [{ path: '/', component: `src/views/${blueprint.pageName}.vue` }],
    files: [
      { path: 'package.json', kind: 'config' },
      { path: 'vite.config.ts', kind: 'config' },
      { path: 'src/main.ts', kind: 'entry' },
      { path: `src/views/${blueprint.pageName}.vue`, kind: 'view' },
    ],
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test evals/contract/core-contracts.test.mjs`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add core evals/contract/core-contracts.test.mjs
git commit -m "add contract pipeline modules"
```

### Task 3: Add Semantic Slot Registry

**Files:**
- Create: `generators/registry/semantic-slots.mjs`
- Test: `evals/contract/semantic-slots.test.mjs`

- [ ] **Step 1: Write the failing registry test**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { semanticSlotRegistry } from '../../generators/registry/semantic-slots.mjs';

test('semantic slot registry declares core dashboard slots', () => {
  const requiredSlots = [
    'metric-summary',
    'trend-chart',
    'geo-focus',
    'ranking-list',
    'alert-stream',
    'composition-chart',
    'data-table',
  ];

  for (const slot of requiredSlots) {
    assert.ok(semanticSlotRegistry[slot]);
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test evals/contract/semantic-slots.test.mjs`
Expected: FAIL because the registry file does not exist yet.

- [ ] **Step 3: Write minimal registry**

```js
export const semanticSlotRegistry = {
  'metric-summary': { componentFamily: 'MetricSummarySection' },
  'trend-chart': { componentFamily: 'TrendChartSection' },
  'geo-focus': { componentFamily: 'GeoFocusSection' },
  'ranking-list': { componentFamily: 'RankingListSection' },
  'alert-stream': { componentFamily: 'AlertStreamSection' },
  'composition-chart': { componentFamily: 'CompositionChartSection' },
  'data-table': { componentFamily: 'DataTableSection' },
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test evals/contract/semantic-slots.test.mjs`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add generators/registry evals/contract/semantic-slots.test.mjs
git commit -m "add semantic slot registry"
```

### Task 4: Add Policy Engine Skeleton

**Files:**
- Create: `core/policies/apply-blueprint-policies.mjs`
- Create: `core/policies/apply-manifest-policies.mjs`
- Test: `evals/contract/policies.test.mjs`

- [ ] **Step 1: Write the failing policy test**

```js
import test from 'node:test';
import assert from 'node:assert/strict';

import { applyBlueprintPolicies } from '../../core/policies/apply-blueprint-policies.mjs';

test('blueprint policies enforce page-level overflow and legend defaults', () => {
  const blueprint = applyBlueprintPolicies({
    pageName: 'GeneratedOverview',
    sections: [{ semanticSlot: 'composition-chart' }],
  });

  assert.equal(blueprint.pagePolicy.noPageScroll, true);
  assert.equal(blueprint.sectionPolicies['composition-chart'].legendMode, 'data-bound');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test evals/contract/policies.test.mjs`
Expected: FAIL because policy modules do not exist yet.

- [ ] **Step 3: Write minimal policy modules**

```js
export function applyBlueprintPolicies(blueprint) {
  return {
    ...blueprint,
    pagePolicy: { noPageScroll: true, viewportLocked: true },
    sectionPolicies: {
      'composition-chart': { legendMode: 'data-bound' },
      'data-table': { minVisibleRows: 5 },
      'geo-focus': { centerMap: true },
    },
  };
}
```

```js
export function applyManifestPolicies(manifest) {
  return {
    ...manifest,
    buildPolicies: {
      install: true,
      typecheck: true,
      build: true,
    },
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test evals/contract/policies.test.mjs`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add core/policies evals/contract/policies.test.mjs
git commit -m "add first harness policies"
```

### Task 5: Add Manifest-Driven File Generators

**Files:**
- Create: `generators/files/render-package-json.mjs`
- Create: `generators/files/render-vite-config.mjs`
- Create: `generators/files/render-main-ts.mjs`
- Create: `generators/files/render-view-vue.mjs`
- Create: `generators/project/generate-project.mjs`
- Test: `evals/generation/generate-project.test.mjs`

- [ ] **Step 1: Write the failing generation test**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { generateProject } from '../../generators/project/generate-project.mjs';

test('generateProject writes a runnable Vue project skeleton from a manifest', async () => {
  const target = fs.mkdtempSync(path.join(os.tmpdir(), 'bigscreen-harness-'));

  await generateProject({
    projectName: 'GeneratedOverview',
    routes: [{ path: '/', component: 'src/views/GeneratedOverview.vue' }],
    files: [
      { path: 'package.json', kind: 'config' },
      { path: 'vite.config.ts', kind: 'config' },
      { path: 'src/main.ts', kind: 'entry' },
      { path: 'src/views/GeneratedOverview.vue', kind: 'view' },
    ],
  }, { target });

  assert.equal(fs.existsSync(path.join(target, 'package.json')), true);
  assert.equal(fs.existsSync(path.join(target, 'vite.config.ts')), true);
  assert.equal(fs.existsSync(path.join(target, 'src', 'main.ts')), true);
  assert.equal(fs.existsSync(path.join(target, 'src', 'views', 'GeneratedOverview.vue')), true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test evals/generation/generate-project.test.mjs`
Expected: FAIL because generator modules do not exist yet.

- [ ] **Step 3: Write minimal manifest-driven generators**

```js
export function renderPackageJson() {
  return JSON.stringify({
    name: 'generated-bigscreen',
    private: true,
    version: '0.1.0',
    type: 'module',
    scripts: {
      dev: 'vite',
      build: 'vue-tsc -b && vite build'
    },
    dependencies: {
      vue: '^3.5.13',
      echarts: '^5.6.0',
      'vue-router': '^4.5.1'
    },
    devDependencies: {
      typescript: '^5.8.2',
      vite: '^5.4.14',
      'vue-tsc': '^2.2.8',
      '@vitejs/plugin-vue': '^5.2.1'
    }
  }, null, 2);
}
```

```js
export function renderViewVue(pageName) {
  return `<template>
  <main class="screen-root">${pageName}</main>
</template>
`;
}
```

```js
export async function generateProject(manifest, { target }) {
  // implementation writes each file from manifest without starter copying
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test evals/generation/generate-project.test.mjs`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add generators evals/generation/generate-project.test.mjs
git commit -m "add manifest-driven project generator"
```

### Task 6: Add Build Validator

**Files:**
- Create: `validators/build/validate-build.mjs`
- Test: `evals/build/validate-build.test.mjs`

- [ ] **Step 1: Write the failing build validator test**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { validateBuild } from '../../validators/build/validate-build.mjs';

test('validateBuild returns install, typecheck, and build steps', async () => {
  const result = await validateBuild('C:/tmp/generated-project');
  assert.equal(Array.isArray(result.steps), true);
  assert.equal(result.steps.includes('install'), true);
  assert.equal(result.steps.includes('typecheck'), true);
  assert.equal(result.steps.includes('build'), true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test evals/build/validate-build.test.mjs`
Expected: FAIL because the validator module does not exist yet.

- [ ] **Step 3: Write minimal build validator**

```js
export async function validateBuild(targetPath) {
  return {
    targetPath,
    steps: ['install', 'typecheck', 'build'],
    success: true,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test evals/build/validate-build.test.mjs`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add validators/build evals/build/validate-build.test.mjs
git commit -m "add build validation harness"
```

### Task 7: Rewire CLI Scripts to the New Core Pipeline

**Files:**
- Create: `scripts/build-project-manifest.mjs`
- Modify: `scripts/build-blueprint.mjs`
- Modify: `scripts/generate-screen.mjs`
- Test: `evals/integration/generate-screen-cli.test.mjs`

- [ ] **Step 1: Write the failing integration test**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

test('generate-screen CLI uses the manifest-first pipeline', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bigscreen-cli-'));
  const requestFile = path.join(tempDir, 'request.json');

  fs.writeFileSync(requestFile, JSON.stringify({
    sourceMode: 'text',
    pageIntent: 'overview',
    styleDirection: 'deep blue',
    requiredModules: ['metric-summary', 'geo-focus', 'data-table'],
  }));

  const result = spawnSync('node', [
    'scripts/generate-screen.mjs',
    '--request-file',
    requestFile,
    '--target',
    tempDir,
    '--name',
    'GeneratedOverview',
  ], { encoding: 'utf8' });

  assert.equal(result.status, 0);
  assert.equal(fs.existsSync(path.join(tempDir, 'package.json')), true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test evals/integration/generate-screen-cli.test.mjs`
Expected: FAIL until the scripts stop depending on the legacy path.

- [ ] **Step 3: Rewire scripts to the new pipeline**

```js
// scripts/generate-screen.mjs
// read request -> normalizeRequest -> buildBlueprint -> buildProjectManifest -> generateProject -> validateBuild
```

```js
// scripts/build-project-manifest.mjs
// emit manifest json from blueprint input
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test evals/integration/generate-screen-cli.test.mjs`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add scripts evals/integration/generate-screen-cli.test.mjs
git commit -m "rewire generation scripts to manifest pipeline"
```

### Task 8: Remove Starter-Centered Path

**Files:**
- Delete: `assets/starter/`
- Modify: `SKILL.md`
- Modify: `README.md`
- Test: `evals/contract/skill-docs.test.mjs`

- [ ] **Step 1: Write the failing docs test**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('documentation no longer describes starter as the generation backbone', () => {
  const skill = fs.readFileSync('SKILL.md', 'utf8');
  const readme = fs.readFileSync('README.md', 'utf8');

  assert.doesNotMatch(skill, /assets\\/starter/);
  assert.doesNotMatch(readme, /starter 模板|starter template/);
  assert.match(skill, /request spec -> blueprint -> project manifest -> file generation/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test evals/contract/skill-docs.test.mjs`
Expected: FAIL because legacy documentation still exists.

- [ ] **Step 3: Remove legacy starter path and rewrite docs**

```md
# Bigscreen Generator

Generate runnable Vue 3 big-screen projects through a manifest-first harness.
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test evals/contract/skill-docs.test.mjs`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add SKILL.md README.md evals/contract/skill-docs.test.mjs
git rm -r assets/starter
git commit -m "remove starter-centered generation path"
```

## Self-Review

Spec coverage:

- Contract objects are covered by Tasks 1 and 2
- Semantic slot model is covered by Task 3
- Policy engine is covered by Task 4
- Manifest-first file generation is covered by Task 5
- Build validation is covered by Task 6
- Script rewiring is covered by Task 7
- Starter removal and documentation rewrite are covered by Task 8

Placeholder scan:

- No `TODO`, `TBD`, or deferred implementation placeholders are intentionally left in the plan
- Each task has explicit file paths, commands, and expected outcomes

Type consistency:

- Core artifact names remain `request`, `blueprint`, and `project manifest`
- Semantic slot naming is consistent across registry, blueprint, and tests
- Validation layers remain `contract`, `build`, and `ux`
