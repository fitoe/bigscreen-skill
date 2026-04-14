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

const args = parseArgs(process.argv);
const input = path.resolve(args.input || path.join(process.cwd(), 'references', 'template-features.json'));
const output = path.resolve(args.output || path.join(process.cwd(), 'references', 'template-index.curated.md'));
const limit = Number(args.limit || 30);

if (!fs.existsSync(input)) {
  console.error(`Missing input: ${input}`);
  process.exit(1);
}

const templates = JSON.parse(fs.readFileSync(input, 'utf8'));

function score(template) {
  let value = 0;
  if (!template.sceneTags.includes('general')) value += 4;
  if (template.chartFamilies.includes('unknown')) value -= 2;
  value += Math.min(template.chartFamilies.length, 5);
  value += template.features.hasMap ? 2 : 0;
  value += template.features.hasTable ? 1 : 0;
  value += template.features.hasAlarm ? 1 : 0;
  value += Math.min(template.fileCount, 12) / 6;
  return value;
}

const selected = [];
const sceneQuota = new Map();

for (const template of [...templates].sort((a, b) => score(b) - score(a))) {
  const primaryScene = template.sceneTags[0] || 'general';
  const quota = sceneQuota.get(primaryScene) || 0;
  if (primaryScene !== 'general' && quota >= 4) continue;
  if (selected.length >= limit) break;
  selected.push(template);
  sceneQuota.set(primaryScene, quota + 1);
}

const content = `# Curated Template Catalog\n\nTop ${selected.length} templates for first-pass retrieval. Generated from \`${path.relative(process.cwd(), input).replace(/\\/g, '/')}\`.\n\n\`\`\`yaml\n${selected
  .map((template) => `- id: ${template.id}
  template_name: ${template.templateName}
  scene_tags: [${template.sceneTags.join(', ')}]
  page_types: [${template.pageTypes.join(', ')}]
  chart_families: [${template.chartFamilies.join(', ')}]
  features:
    has_map: ${template.features.hasMap}
    has_table: ${template.features.hasTable}
    has_alarm: ${template.features.hasAlarm}
    has_gauge: ${template.features.hasGauge}
  score: ${score(template).toFixed(2)}`)
  .join('\n\n')}\n\`\`\`\n`;

fs.writeFileSync(output, content, 'utf8');
console.log(`Wrote curated catalog with ${selected.length} templates to ${output}`);
