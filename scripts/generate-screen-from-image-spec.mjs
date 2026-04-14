#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

import { buildPromptFromImageSpec } from './build-prompt-from-image-spec.mjs';
import { formatBlueprintMarkdown, generateBlueprint } from './build-blueprint.mjs';
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
const inputFile = args['input-file'] ? path.resolve(args['input-file']) : null;
const target = args.target ? path.resolve(args.target) : null;

if (!inputFile || !target) {
  console.error('Usage: node scripts/generate-screen-from-image-spec.mjs --input-file <image-spec.json> --target <dir> [--name Name]');
  process.exit(1);
}

const input = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
const promptPackage = buildPromptFromImageSpec(input);
const blueprint = generateBlueprint(promptPackage.naturalPrompt, {
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
fs.writeFileSync(path.join(docsDir, `${result.slug}.image-prompt.json`), JSON.stringify(promptPackage, null, 2), 'utf8');

console.log(`Generated screen project from image spec at ${result.target}`);

if (args.playwright) {
  const validatorArgs = [
    path.resolve('scripts/playwright-validate-screen.mjs'),
    '--target',
    result.target,
    '--reference-spec-file',
    inputFile,
  ];
  if (args['install-deps']) validatorArgs.push('--install-deps');
  if (args['reference-image']) validatorArgs.push('--reference-image', path.resolve(args['reference-image']));
  execFileSync(process.execPath, validatorArgs, { stdio: 'inherit' });
}
