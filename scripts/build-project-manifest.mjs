#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

import { buildProjectManifest } from '../core/manifest/build-project-manifest.mjs';

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

if (!blueprintFile) {
  console.error('Usage: node scripts/build-project-manifest.mjs --blueprint-file <file> [--output file]');
  process.exit(1);
}

const blueprint = JSON.parse(fs.readFileSync(blueprintFile, 'utf8'));
const manifest = buildProjectManifest(blueprint);
const outputText = JSON.stringify(manifest, null, 2);

if (args.output) {
  const outputPath = path.resolve(args.output);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, outputText, 'utf8');
  console.log(`Wrote manifest to ${outputPath}`);
} else {
  console.log(outputText);
}
