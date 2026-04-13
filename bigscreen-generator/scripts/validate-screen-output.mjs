#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

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

function assertExists(file, errors) {
  if (!fs.existsSync(file)) errors.push(`Missing required file: ${file}`);
}

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else acc.push(full);
  }
  return acc;
}

function resolveAliasImport(fromFile, specifier, targetRoot) {
  if (!specifier.startsWith('@/')) return null;
  const relative = specifier.slice(2);
  return path.join(targetRoot, 'src', relative);
}

const args = parseArgs(process.argv);
const target = args.target ? path.resolve(args.target) : null;

if (!target) {
  console.error('Usage: node scripts/validate-screen-output.mjs --target <project-path>');
  process.exit(1);
}

const errors = [];
const warnings = [];
const required = [
  path.join(target, 'src', 'views'),
  path.join(target, 'src', 'components', 'bigscreen'),
  path.join(target, 'src', 'components', 'bigscreen', 'charts'),
  path.join(target, 'src', 'composables'),
  path.join(target, 'src', 'mock'),
  path.join(target, 'src', 'api'),
  path.join(target, 'src', 'theme'),
];

for (const file of required) assertExists(file, errors);

const files = walk(path.join(target, 'src'));
const pageFiles = files.filter((file) => file.includes(`${path.sep}views${path.sep}`) && file.endsWith('.vue'));
for (const file of pageFiles) {
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/).length;
  if (lines > 260) warnings.push(`Page file is large (${lines} lines): ${file}`);
}

for (const file of files.filter((entry) => /\.(vue|ts|scss|css)$/i.test(entry))) {
  const text = fs.readFileSync(file, 'utf8');
  const colorHits = text.match(/#[0-9a-fA-F]{6}/g) || [];
  if (file.includes(`${path.sep}views${path.sep}`) && colorHits.length > 6) {
    warnings.push(`Page file contains many literal colors (${colorHits.length}): ${file}`);
  }
  if (file.includes(`${path.sep}views${path.sep}`) && /series:\s*\[/.test(text)) {
    warnings.push(`Page file appears to embed chart options directly: ${file}`);
  }
  const imports = [...text.matchAll(/from\s+['"](@\/[^'"]+)['"]/g)].map((match) => match[1]);
  for (const specifier of imports) {
    const resolved = resolveAliasImport(file, specifier, target);
    if (!resolved) continue;
    const candidates = [resolved, `${resolved}.ts`, `${resolved}.vue`, path.join(resolved, 'index.ts')];
    if (!candidates.some((candidate) => fs.existsSync(candidate))) {
      errors.push(`Broken alias import in ${file}: ${specifier}`);
    }
  }
}

if (errors.length) {
  console.error('Validation failed:\n' + errors.map((item) => `- ${item}`).join('\n'));
  process.exit(1);
}

console.log('Validation passed');
if (warnings.length) {
  console.log('Warnings:');
  for (const warning of warnings) console.log(`- ${warning}`);
}
