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

function analyzeBlueprintQuality(blueprint, warnings) {
  if (!Array.isArray(blueprint.blockPriority) || !blueprint.blockPriority.length) {
    warnings.push('Missing blueprint blockPriority metadata.');
  }
  if (!blueprint.heightStrategy?.overall) {
    warnings.push('Missing blueprint heightStrategy metadata.');
  }

  const sections = Array.isArray(blueprint.sections) ? blueprint.sections : [];
  if (sections.length > 8) {
    warnings.push(`Section count is high (${sections.length}); consider merging weak modules to protect readability.`);
  }

  const rightSummary = sections.filter((section) => ['right', 'side'].includes(section.area));
  const bottomTable = sections.find((section) => section.purpose === 'table');
  const sameMinHeights = new Set(
    sections
      .map((section) => section.heightPolicy?.min)
      .filter((value) => typeof value === 'number'),
  );
  const smallChartPanels = sections.filter(
    (section) => section.dataContract?.type === 'chart-series' && Number(section.heightPolicy?.min || 0) < 220,
  );

  if (rightSummary.length > 2) {
    warnings.push(`Right-side summary zone is too dense (${rightSummary.length} modules).`);
  }
  if (bottomTable && Number(bottomTable.heightPolicy?.min || 0) < 240) {
    warnings.push(`Bottom table height is low (${bottomTable.heightPolicy?.min}px).`);
  }
  if (sameMinHeights.size <= 1 && sections.length >= 4) {
    warnings.push('Section minimum heights are too uniform; this suggests even area splitting.');
  }
  if (smallChartPanels.length >= 2) {
    warnings.push('Multiple chart panels have low minimum heights; consider promoting one primary chart.');
  }
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
const blueprintFiles = walk(path.join(target, 'docs', 'screen-specs')).filter((file) => file.endsWith('.blueprint.json'));
const pageFiles = files.filter((file) => file.includes(`${path.sep}views${path.sep}`) && file.endsWith('.vue'));
for (const file of pageFiles) {
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/).length;
  if (lines > 260) warnings.push(`Page file is large (${lines} lines): ${file}`);
}

for (const blueprintFile of blueprintFiles) {
  try {
    const blueprint = JSON.parse(fs.readFileSync(blueprintFile, 'utf8'));
    analyzeBlueprintQuality(blueprint, warnings);
  } catch (error) {
    warnings.push(`Unable to parse blueprint file: ${blueprintFile}`);
  }
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
