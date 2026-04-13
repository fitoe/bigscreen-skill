#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

function copyDir(source, target) {
  fs.mkdirSync(target, { recursive: true });
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const from = path.join(source, entry.name);
    const to = path.join(target, entry.name);
    if (entry.isDirectory()) copyDir(from, to);
    else fs.copyFileSync(from, to);
  }
}

function toSlug(value) {
  return value.replace(/[A-Z]/g, (match, index) => (index === 0 ? match.toLowerCase() : `-${match.toLowerCase()}`));
}

function toCamelPrefix(value) {
  return `${value[0].toLowerCase()}${value.slice(1)}`;
}

function toWords(value) {
  return value.replace(/([a-z0-9])([A-Z])/g, '$1 $2');
}

const args = parseArgs(process.argv);
const target = args.target ? path.resolve(args.target) : null;
const name = args.name || 'GeneratedBigscreen';
const starter = path.resolve(__dirname, '..', 'assets', 'starter');
const mockSlug = toSlug(name);
const mockVar = `${toCamelPrefix(name)}Mock`;
const humanTitle = toWords(name);

if (!target) {
  console.error('Usage: node scripts/scaffold-screen.mjs --target <project-path> [--name ScreenName]');
  process.exit(1);
}

copyDir(starter, target);

const exampleView = path.join(target, 'src', 'views', 'GeneratedOverview.vue');
const nextView = path.join(target, 'src', 'views', `${name}.vue`);
if (fs.existsSync(exampleView)) {
  fs.renameSync(exampleView, nextView);
  const content = fs
    .readFileSync(nextView, 'utf8')
    .replace(/GeneratedOverview/g, name)
    .replace(/useGeneratedOverview/g, `use${name}`)
    .replace(/Generated Overview/g, humanTitle);
  fs.writeFileSync(nextView, content, 'utf8');
}

const exampleComposable = path.join(target, 'src', 'composables', 'useGeneratedOverview.ts');
const nextComposable = path.join(target, 'src', 'composables', `use${name}.ts`);
if (fs.existsSync(exampleComposable)) {
  fs.renameSync(exampleComposable, nextComposable);
  const composableSource = fs
    .readFileSync(nextComposable, 'utf8')
    .replace(/useGeneratedOverview/g, `use${name}`)
    .replace(/generatedOverviewMock/g, mockVar)
    .replace(/generated-overview/g, mockSlug);
  fs.writeFileSync(nextComposable, composableSource, 'utf8');
}

const exampleMock = path.join(target, 'src', 'mock', 'generated-overview.ts');
const nextMock = path.join(target, 'src', 'mock', `${mockSlug}.ts`);
if (fs.existsSync(exampleMock)) {
  fs.renameSync(exampleMock, nextMock);
  const mockSource = fs.readFileSync(nextMock, 'utf8').replace(/generatedOverviewMock/g, mockVar).replace(/Generated Overview/g, humanTitle);
  fs.writeFileSync(nextMock, mockSource, 'utf8');
}

const routerFile = path.join(target, 'src', 'router', 'index.ts');
if (fs.existsSync(routerFile)) {
  const routerSource = fs
    .readFileSync(routerFile, 'utf8')
    .replace(/GeneratedOverview/g, name)
    .replace(/generated-overview/g, mockSlug);
  fs.writeFileSync(routerFile, routerSource, 'utf8');
}

console.log(`Scaffolded ${name} at ${target}`);
