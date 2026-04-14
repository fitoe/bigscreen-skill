#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

import { generateBlueprint, formatBlueprintMarkdown } from './build-blueprint.mjs';
import { generateProjectFromBlueprint } from './generate-from-blueprint.mjs';

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
const requestFile = args['request-file'] ? path.resolve(args['request-file']) : null;
const target = args.target ? path.resolve(args.target) : null;

if (!requestFile || !target) {
  console.error('Usage: node scripts/generate-screen.mjs --request-file <file> --target <dir> [--name Name]');
  process.exit(1);
}

const request = fs.readFileSync(requestFile, 'utf8');
const blueprint = generateBlueprint(request, {
  templateFeaturesPath: args['template-features'] ? path.resolve(args['template-features']) : undefined,
  maxReferences: args.limit ? Number(args.limit) : undefined,
});

const result = await generateProjectFromBlueprint(blueprint, {
  target,
  projectName: args.name || blueprint.pageName,
});

const docsDir = path.join(target, 'docs', 'screen-specs');
fs.mkdirSync(docsDir, { recursive: true });
fs.writeFileSync(path.join(docsDir, `${result.slug}.blueprint.json`), JSON.stringify(blueprint, null, 2), 'utf8');
fs.writeFileSync(path.join(docsDir, `${result.slug}.blueprint.md`), formatBlueprintMarkdown(blueprint), 'utf8');

console.log(`Generated screen project at ${result.target}`);

if (args.playwright) {
  const validatorArgs = [
    path.resolve('scripts/playwright-validate-screen.mjs'),
    '--target',
    result.target,
  ];
  if (args['install-deps']) validatorArgs.push('--install-deps');
  if (args['reference-spec-file']) validatorArgs.push('--reference-spec-file', path.resolve(args['reference-spec-file']));
  if (args['reference-image']) validatorArgs.push('--reference-image', path.resolve(args['reference-image']));
  execFileSync(process.execPath, validatorArgs, { stdio: 'inherit' });
}
