#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { normalizeRequest } from '../core/request/normalize-request.mjs';
import { buildBlueprint } from '../core/blueprint/build-blueprint.mjs';
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

function mergeUnique(base, extras) {
  return [...new Set([...(base || []), ...(extras || [])])];
}

function inferRevisionFields(revisionText) {
  const prompt = String(revisionText || '').trim();
  const lower = prompt.toLowerCase();
  const patch = {
    originalPrompt: prompt,
    requiredModules: [],
  };

  if (/排行|ranking/.test(prompt)) patch.requiredModules.push('ranking-list');
  if (/构成|composition|占比/.test(prompt)) patch.requiredModules.push('composition-chart');
  if (/底部表格|表格加高|table/.test(prompt)) patch.requiredModules.push('data-table');
  if (/地图|map/.test(prompt)) patch.requiredModules.push('geo-focus');
  if (/告警|alert|alarm/.test(prompt)) patch.requiredModules.push('alert-stream');

  if (/保留首页|首页|overview-home/.test(prompt)) patch.pageType = 'overview-home';
  if (/不要切换成专题页/.test(prompt) && !patch.pageType) patch.pageType = 'overview-home';

  if (/领导|executive|leader/.test(lower)) patch.audience = 'leadership';

  return patch;
}

export function reviseBlueprint(baseBlueprintInput, revisionInput, options = {}) {
  const baseBlueprint = typeof baseBlueprintInput === 'string' ? JSON.parse(baseBlueprintInput) : baseBlueprintInput;
  const revisionPatch =
    typeof revisionInput === 'string' && revisionInput.trim().startsWith('{')
      ? JSON.parse(revisionInput)
      : inferRevisionFields(revisionInput);

  const baseRequest = {
    sourceMode: 'revision',
    pageIntent: baseBlueprint.layoutPattern || 'overview',
    styleDirection: baseBlueprint.themeDirection || 'deep blue',
    requiredModules: baseBlueprint.sections?.map((section) => section.semanticSlot).filter(Boolean) || [],
    originalPrompt: '',
  };

  const nextRequest = {
    ...baseRequest,
    pageIntent: revisionPatch.pageType || revisionPatch.pageIntent || baseRequest.pageIntent,
    styleDirection: revisionPatch.styleDirection || baseRequest.styleDirection,
    requiredModules: mergeUnique(baseRequest.requiredModules, revisionPatch.requiredModules),
    originalPrompt: [baseRequest.originalPrompt, revisionPatch.originalPrompt].filter(Boolean).join('\n'),
  };

  return buildBlueprint(normalizeRequest(nextRequest), options);
}

const args = parseArgs(process.argv);
const blueprintFile = args['blueprint-file'] ? path.resolve(args['blueprint-file']) : null;
const revisionFile = args['revision-file'] ? path.resolve(args['revision-file']) : null;
const isMainModule = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMainModule) {
  if (!blueprintFile || !revisionFile) {
    console.error('Usage: node scripts/revise-blueprint.mjs --blueprint-file <file> --revision-file <file> [--format json|md] [--output file]');
    process.exit(1);
  }

  const base = fs.readFileSync(blueprintFile, 'utf8');
  const revision = fs.readFileSync(revisionFile, 'utf8');
  const revised = reviseBlueprint(base, revision, {
    templateFeaturesPath: args['template-features'] ? path.resolve(args['template-features']) : undefined,
    maxReferences: args.limit ? Number(args.limit) : undefined,
  });
  const outputText = args.format === 'md' ? formatBlueprintMarkdown(revised) : JSON.stringify(revised, null, 2);

  if (args.output) {
    const outputFile = path.resolve(args.output);
    fs.mkdirSync(path.dirname(outputFile), { recursive: true });
    fs.writeFileSync(outputFile, outputText, 'utf8');
    console.log(`Wrote revised blueprint to ${outputFile}`);
  } else {
    console.log(outputText);
  }
}
