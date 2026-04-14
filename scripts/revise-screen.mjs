#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

import { reviseBlueprint } from './revise-blueprint.mjs';
import { buildProjectManifest } from '../core/manifest/build-project-manifest.mjs';
import { applyBlueprintPolicies } from '../core/policies/apply-blueprint-policies.mjs';
import { applyManifestPolicies } from '../core/policies/apply-manifest-policies.mjs';
import { generateProject } from '../generators/project/generate-project.mjs';
import { validateBuild } from '../validators/build/validate-build.mjs';
import { validateUx } from '../validators/ux/validate-ux.mjs';
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
const blueprintFile = args['blueprint-file'] ? path.resolve(args['blueprint-file']) : null;
const revisionFile = args['revision-file'] ? path.resolve(args['revision-file']) : null;
const target = args.target ? path.resolve(args.target) : null;

if (!blueprintFile || !revisionFile || !target) {
  console.error('Usage: node scripts/revise-screen.mjs --blueprint-file <file> --revision-file <file> --target <dir> [--name Name]');
  process.exit(1);
}

const base = fs.readFileSync(blueprintFile, 'utf8');
const revision = fs.readFileSync(revisionFile, 'utf8');
const revisedBlueprint = applyBlueprintPolicies(reviseBlueprint(base, revision));
const manifest = applyManifestPolicies(buildProjectManifest(revisedBlueprint));

await generateProject(manifest, { target });

const docsDir = path.join(target, 'docs', 'screen-specs');
fs.mkdirSync(docsDir, { recursive: true });
fs.writeFileSync(path.join(docsDir, `${manifest.projectName}.blueprint.json`), JSON.stringify(revisedBlueprint, null, 2), 'utf8');
fs.writeFileSync(path.join(docsDir, `${manifest.projectName}.blueprint.md`), formatBlueprintMarkdown(revisedBlueprint), 'utf8');
fs.writeFileSync(path.join(docsDir, `${manifest.projectName}.manifest.json`), JSON.stringify(manifest, null, 2), 'utf8');

if (args.build) {
  const report = await validateBuild(target);
  fs.writeFileSync(path.join(docsDir, `${manifest.projectName}.build.json`), JSON.stringify(report, null, 2), 'utf8');
}

const uxReport = validateUx(target, {
  referenceSpecFile: path.join(docsDir, `${manifest.projectName}.blueprint.json`),
});
fs.writeFileSync(path.join(docsDir, `${manifest.projectName}.ux.json`), JSON.stringify(uxReport, null, 2), 'utf8');

console.log(`Revised screen project at ${target}`);
