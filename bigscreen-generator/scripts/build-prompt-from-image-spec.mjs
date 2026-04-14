#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

function normalizeArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return String(value)
    .split(/[,，、]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function inferModules(spec) {
  const modules = normalizeArray(spec.mustModules || spec.modules);
  if (modules.length) return modules;

  const result = [];
  const text = JSON.stringify(spec);
  if (/kpi|metric|stat|指标/i.test(text)) result.push('kpi');
  if (/map|geo|region|district|区县|地图/i.test(text)) result.push('map');
  if (/trend|line|走势/i.test(text)) result.push('trend');
  if (/compare|bar|对比/i.test(text)) result.push('compare');
  if (/pie|ring|composition|占比|构成/i.test(text)) result.push('composition');
  if (/ranking|rank|排行/i.test(text)) result.push('ranking');
  if (/alert|alarm|event|告警/i.test(text)) result.push('alerts');
  if (/table|ledger|list|表格|台账/i.test(text)) result.push('table');
  return [...new Set(result)];
}

function buildNaturalPrompt(spec) {
  const topic = spec.topic || spec.title || '数据可视化大屏';
  const pageType = spec.pageType || 'overview-home';
  const style = spec.style || '深蓝科技大屏';
  const layoutNarrative = normalizeArray(spec.layoutNarrative || spec.layout || spec.layoutNotes);
  const keyMetrics = normalizeArray(spec.keyMetrics || spec.metrics);
  const mustModules = inferModules(spec);
  const constraints = normalizeArray(spec.constraints);
  const panelChrome = spec.panelChrome || {};
  const chromeText = [panelChrome.variant, panelChrome.titleBar, panelChrome.borderStyle].filter(Boolean).join(' / ');
  const moduleNotes = normalizeArray(spec.moduleNotes);

  return `生成一个可运行的大屏首页（Vue3 + ECharts）。

主题：${topic}
页面类型：${pageType}
风格：${style}${chromeText ? `，保留模板式模块边框、标题栏背景、发光描边，参考 ${chromeText}` : '，保留模板式模块边框、标题栏背景、发光描边'}
数据密度：高

核心布局：
${layoutNarrative.map((item) => `- ${item}`).join('\n')}

关键指标：
${keyMetrics.map((item) => `- ${item}`).join('\n')}

必须模块：
${mustModules.map((item) => `- ${item}`).join('\n')}

模块说明：
${moduleNotes.map((item) => `- ${item}`).join('\n')}

生成约束：
${[
  '首屏完整展示，不出现页面级纵向滚动条',
  '主视觉区块最大',
  '保留 panel chrome',
  ...constraints,
]
  .map((item) => `- ${item}`)
  .join('\n')}`;
}

export function buildPromptFromImageSpec(input) {
  const spec = typeof input === 'string' ? JSON.parse(input) : input;
  const mustModules = inferModules(spec);
  const structuredPrompt = {
    topic: spec.topic || spec.title || '数据可视化大屏',
    pageType: spec.pageType || 'overview-home',
    style: spec.style || '深蓝科技大屏',
    layoutNarrative: normalizeArray(spec.layoutNarrative || spec.layout || spec.layoutNotes),
    mustModules,
    keyMetrics: normalizeArray(spec.keyMetrics || spec.metrics),
    panelChrome: spec.panelChrome || {},
    moduleNotes: normalizeArray(spec.moduleNotes),
    constraints: normalizeArray(spec.constraints),
  };

  return {
    naturalPrompt: buildNaturalPrompt({ ...spec, ...structuredPrompt }),
    structuredPrompt,
  };
}

const args = parseArgs(process.argv);
const inputFile = args['input-file'] ? path.resolve(args['input-file']) : null;
const isMainModule = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMainModule) {
  if (!inputFile) {
    console.error('Usage: node scripts/build-prompt-from-image-spec.mjs --input-file <image-spec.json> [--output file]');
    process.exit(1);
  }

  const input = fs.readFileSync(inputFile, 'utf8');
  const result = buildPromptFromImageSpec(input);
  const outputText = JSON.stringify(result, null, 2);

  if (args.output) {
    const outputFile = path.resolve(args.output);
    fs.mkdirSync(path.dirname(outputFile), { recursive: true });
    fs.writeFileSync(outputFile, outputText, 'utf8');
    console.log(`Wrote prompt package to ${outputFile}`);
  } else {
    console.log(outputText);
  }
}
