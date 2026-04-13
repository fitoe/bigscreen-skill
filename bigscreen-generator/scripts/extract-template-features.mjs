#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { collectChartFamilies, collectFeatures, getTemplateName, inferPageTypes, inferSceneTags } from './template-analysis.mjs';

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

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.git')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else acc.push(full);
  }
  return acc;
}

const args = parseArgs(process.argv);
const source = args.source ? path.resolve(args.source) : null;
const output = path.resolve(args.output || path.join(process.cwd(), 'references', 'template-features.json'));

if (!source || !fs.existsSync(source)) {
  console.error('Usage: node scripts/extract-template-features.mjs --source <BigDataView-path> [--output file]');
  process.exit(1);
}

const templates = [];
for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const root = path.join(source, entry.name);
  const templateName = getTemplateName(root);
  const files = walk(root).filter((file) => /\.(html|vue|js|ts|css|scss)$/i.test(file));
  if (!files.length) continue;
  const text = files.slice(0, 30).map((file) => fs.readFileSync(file, 'utf8')).join('\n');
  templates.push({
    id: entry.name,
    templateName,
    fileCount: files.length,
    sceneTags: inferSceneTags(templateName),
    pageTypes: inferPageTypes(templateName),
    chartFamilies: collectChartFamilies(text),
    features: collectFeatures(text, templateName),
  });
}

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, JSON.stringify(templates, null, 2), 'utf8');
console.log(`Wrote feature summary for ${templates.length} templates to ${output}`);
