#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

import { buildPromptFromImageSpec } from './build-prompt-from-image-spec.mjs';
import { normalizeRequest } from '../core/request/normalize-request.mjs';
import { buildBlueprint } from '../core/blueprint/build-blueprint.mjs';
import { buildProjectManifest } from '../core/manifest/build-project-manifest.mjs';
import { applyBlueprintPolicies } from '../core/policies/apply-blueprint-policies.mjs';
import { applyManifestPolicies } from '../core/policies/apply-manifest-policies.mjs';
import { generateProject } from '../generators/project/generate-project.mjs';
import { validateBuild } from '../validators/build/validate-build.mjs';
import { formatBlueprintMarkdown } from './build-blueprint.mjs';

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i += 1) {
    const part = argv[i];
    if (part.startsWith('--')) {
      args[part.slice(2)] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
    }
  }
  return args;
}

const args = parseArgs(process.argv);
const inputFile = args['input-file'] ? path.resolve(args['input-file']) : null;
const target = args.target ? path.resolve(args.target) : null;

if (!inputFile || !target) {
  console.error('Usage: node scripts/generate-screen-from-image-spec.mjs --input-file <image-spec.json> --target <dir> [--name Name]');
  process.exit(1);
}

const rawSpec = fs.readFileSync(inputFile, 'utf8').replace(/^\uFEFF/, '');
const imageSpec = JSON.parse(rawSpec);
const promptPackage = buildPromptFromImageSpec(imageSpec);

const request = normalizeRequest({
  sourceMode: 'image',
  pageIntent: promptPackage.structuredPrompt.pageType || 'overview',
  styleDirection: promptPackage.structuredPrompt.style || 'deep blue',
  requiredModules: promptPackage.structuredPrompt.mustModules || [],
});

const blueprint = applyBlueprintPolicies(buildBlueprint(request));
const manifest = applyManifestPolicies(buildProjectManifest(blueprint));

await generateProject(manifest, { target });

const docsDir = path.join(target, 'docs', 'screen-specs');
fs.mkdirSync(docsDir, { recursive: true });
fs.writeFileSync(path.join(docsDir, `${manifest.projectName}.image-spec.json`), JSON.stringify(imageSpec, null, 2), 'utf8');
fs.writeFileSync(path.join(docsDir, `${manifest.projectName}.prompt.json`), JSON.stringify(promptPackage, null, 2), 'utf8');
fs.writeFileSync(path.join(docsDir, `${manifest.projectName}.blueprint.json`), JSON.stringify(blueprint, null, 2), 'utf8');
fs.writeFileSync(path.join(docsDir, `${manifest.projectName}.blueprint.md`), formatBlueprintMarkdown(blueprint), 'utf8');
fs.writeFileSync(path.join(docsDir, `${manifest.projectName}.manifest.json`), JSON.stringify(manifest, null, 2), 'utf8');

if (args.build) {
  const report = await validateBuild(target);
  fs.writeFileSync(path.join(docsDir, `${manifest.projectName}.build.json`), JSON.stringify(report, null, 2), 'utf8');
}

console.log(`Generated screen project at ${target}`);
