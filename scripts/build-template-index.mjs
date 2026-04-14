#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {
  collectChartFamilies,
  collectFeatures,
  getTemplateName,
  inferDensity,
  inferLayoutType,
  inferPageTypes,
  inferSceneTags,
  inferStrongSections,
  inferTone,
} from './template-analysis.mjs';

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

function walk(dir, fileList = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.git')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, fileList);
    else fileList.push(full);
  }
  return fileList;
}

function detectTemplateRoot(files) {
  const html = files.find((file) => file.endsWith('.html'));
  return html ? path.dirname(html) : path.dirname(files[0]);
}

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const args = parseArgs(process.argv);
const source = args.source ? path.resolve(args.source) : null;
const output = path.resolve(args.output || path.join(process.cwd(), 'references', 'template-index.generated.md'));

if (!source || !fs.existsSync(source)) {
  console.error('Usage: node scripts/build-template-index.mjs --source <BigDataView-path> [--output file]');
  process.exit(1);
}

const candidates = fs.readdirSync(source, { withFileTypes: true }).filter((entry) => entry.isDirectory());
const blocks = [];

for (const dir of candidates) {
  const full = path.join(source, dir.name);
  const files = walk(full);
  const frontFiles = files.filter((file) => /\.(html|vue|js|ts|css|scss)$/i.test(file));
  if (frontFiles.length === 0) continue;
  const templateRoot = detectTemplateRoot(frontFiles);
  const templateName = getTemplateName(full);
  const htmlCount = frontFiles.filter((file) => file.endsWith('.html')).length;
  const vueCount = frontFiles.filter((file) => file.endsWith('.vue')).length;
  const text = frontFiles.slice(0, 20).map((file) => fs.readFileSync(file, 'utf8')).join('\n');
  const features = collectFeatures(text, templateName);
  const chartFamilies = collectChartFamilies(text);
  const layout = inferLayoutType(features);
  const tone = inferTone(features, templateName);
  blocks.push(`- id: ${slugify(dir.name)}
  source_path: ${path.relative(process.cwd(), templateRoot).replace(/\\/g, '/')}
  scene_tags: [${inferSceneTags(templateName).join(', ')}]
  page_types: [${inferPageTypes(templateName).join(', ')}]
  layout_type: ${layout}
  tone: ${tone}
  data_density: ${inferDensity(frontFiles.length, features)}
  chart_families: [${chartFamilies.join(', ')}]
  strong_sections: [${inferStrongSections(features).join(', ')}]
  borrow_for: [${inferPageTypes(templateName).join(', ')}]
  avoid: [exact markup reuse]
  notes: { html_files: ${htmlCount}, vue_files: ${vueCount}, has_map: ${features.hasMap} }`);
}

const content = `# Generated Template Index\n\nGenerated from \`${source.replace(/\\/g, '/')}\`.\nReview and replace pending fields manually.\n\n\`\`\`yaml\n${blocks.join('\n\n')}\n\`\`\`\n`;
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, content, 'utf8');
console.log(`Wrote ${blocks.length} template entries to ${output}`);
