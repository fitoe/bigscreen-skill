#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

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

function parseRequestInput(raw) {
  if (typeof raw !== 'string') return raw;
  const trimmed = raw.trim();
  if (!trimmed) return {};
  try {
    return JSON.parse(trimmed);
  } catch {
    return {
      sourceMode: 'text',
      pageIntent: 'overview',
      styleDirection: 'deep blue',
      requiredModules: [],
    };
  }
}

const args = parseArgs(process.argv);
const requestFile = args['request-file'] ? path.resolve(args['request-file']) : null;
const target = args.target ? path.resolve(args.target) : null;

if (!requestFile || !target) {
  console.error('Usage: node scripts/generate-screen.mjs --request-file <file> --target <dir> [--name Name]');
  process.exit(1);
}

const rawRequest = fs.readFileSync(requestFile, 'utf8');
const request = normalizeRequest(parseRequestInput(rawRequest));
const blueprint = applyBlueprintPolicies(buildBlueprint(request));
const manifest = applyManifestPolicies(buildProjectManifest(blueprint));

await generateProject(manifest, { target });

const docsDir = path.join(target, 'docs', 'screen-specs');
fs.mkdirSync(docsDir, { recursive: true });
fs.writeFileSync(path.join(docsDir, `${manifest.projectName}.blueprint.json`), JSON.stringify(blueprint, null, 2), 'utf8');
fs.writeFileSync(path.join(docsDir, `${manifest.projectName}.blueprint.md`), formatBlueprintMarkdown(blueprint), 'utf8');
fs.writeFileSync(path.join(docsDir, `${manifest.projectName}.manifest.json`), JSON.stringify(manifest, null, 2), 'utf8');

if (args.build) {
  const report = await validateBuild(target);
  fs.writeFileSync(path.join(docsDir, `${manifest.projectName}.build.json`), JSON.stringify(report, null, 2), 'utf8');
}

console.log(`Generated screen project at ${target}`);
