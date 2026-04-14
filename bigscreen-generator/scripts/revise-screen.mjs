#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

import { formatBlueprintMarkdown } from './build-blueprint.mjs';
import { generateProjectFromBlueprint } from './generate-from-blueprint.mjs';
import { reviseBlueprint } from './revise-blueprint.mjs';

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

function toSlug(value) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/\s+/g, '-')
    .toLowerCase();
}

const args = parseArgs(process.argv);
const blueprintFile = args['blueprint-file'] ? path.resolve(args['blueprint-file']) : null;
const revisionFile = args['revision-file'] ? path.resolve(args['revision-file']) : null;
const target = args.target ? path.resolve(args.target) : null;

if (!blueprintFile || !revisionFile || !target) {
  console.error('Usage: node scripts/revise-screen.mjs --blueprint-file <file> --revision-file <file> --target <dir> [--name Name]');
  process.exit(1);
}

const revised = reviseBlueprint(fs.readFileSync(blueprintFile, 'utf8'), fs.readFileSync(revisionFile, 'utf8'), {
  templateFeaturesPath: args['template-features'] ? path.resolve(args['template-features']) : undefined,
  maxReferences: args.limit ? Number(args.limit) : undefined,
});

const projectName = args.name || revised.pageName;
const result = generateProjectFromBlueprint(revised, {
  target,
  projectName,
});

const docsDir = path.join(target, 'docs', 'screen-specs');
fs.mkdirSync(docsDir, { recursive: true });
fs.writeFileSync(path.join(docsDir, `${result.slug}.blueprint.json`), JSON.stringify(revised, null, 2), 'utf8');
fs.writeFileSync(path.join(docsDir, `${result.slug}.blueprint.md`), formatBlueprintMarkdown(revised), 'utf8');

console.log(`Revised screen project at ${target} (${toSlug(projectName)})`);
