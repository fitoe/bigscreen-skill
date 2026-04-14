#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { normalizeRequest } from '../core/request/normalize-request.mjs';
import { buildBlueprint } from '../core/blueprint/build-blueprint.mjs';

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

export function formatBlueprintMarkdown(blueprint) {
  return `# ${blueprint.pageName} Blueprint

## Layout Pattern

${blueprint.layoutPattern}

## Theme Direction

${blueprint.themeDirection}

## Sections

${(blueprint.sections || [])
  .map((section) => `- ${section.id} | slot=${section.semanticSlot} | component=${section.component}`)
  .join('\n')}
`;
}

export function generateBlueprint(rawRequest) {
  const parsed = parseRequestInput(rawRequest);
  const request = normalizeRequest(parsed);
  return buildBlueprint(request);
}

const isMainModule = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMainModule) {
  const args = parseArgs(process.argv);
  const rawRequest = args['request-file']
    ? fs.readFileSync(path.resolve(args['request-file']), 'utf8')
    : args.request;

  if (!rawRequest) {
    console.error('Usage: node scripts/build-blueprint.mjs --request <json> [--output file] [--format json|md]');
    process.exit(1);
  }

  const blueprint = generateBlueprint(rawRequest);
  const outputText = args.format === 'json' ? JSON.stringify(blueprint, null, 2) : formatBlueprintMarkdown(blueprint);

  if (args.output) {
    const outputPath = path.resolve(args.output);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, outputText, 'utf8');
    console.log(`Wrote blueprint to ${outputPath}`);
  } else {
    console.log(outputText);
  }
}
