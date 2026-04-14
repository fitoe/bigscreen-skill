import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'bigscreen-screen-'));
}

test('generate-screen script writes project and blueprint artifacts', () => {
  const tempDir = makeTempDir();
  execFileSync(
    process.execPath,
    [
      path.resolve('scripts/generate-screen.mjs'),
      '--request-file',
      path.resolve('tests/fixtures/traffic-map-command.request.json'),
      '--target',
      tempDir,
      '--name',
      'TrafficCommandCenter',
    ],
    { stdio: 'pipe' },
  );

  assert.ok(fs.existsSync(path.join(tempDir, 'src', 'views', 'TrafficCommandCenter.vue')));
  assert.ok(fs.existsSync(path.join(tempDir, 'docs', 'screen-specs', 'traffic-command-center.blueprint.json')));
  assert.ok(fs.existsSync(path.join(tempDir, 'docs', 'screen-specs', 'traffic-command-center.blueprint.md')));

  const packageSource = JSON.parse(fs.readFileSync(path.join(tempDir, 'package.json'), 'utf8'));
  assert.ok(packageSource.devDependencies.tailwindcss);
  assert.ok(packageSource.devDependencies['@tailwindcss/vite']);
});

test('generate-screen script accepts plain prompt request files', () => {
  const tempDir = makeTempDir();
  const promptFile = path.join(tempDir, 'prompt.txt');
  fs.writeFileSync(
    promptFile,
    `生成一个可运行的大屏首页（Vue3 + ECharts）。
主题：智慧交通
关键指标：在线车辆、事件告警、路网负载
风格：深蓝指挥中心
必须模块：kpi、地图、趋势、告警、表格
数据密度：高`,
    'utf8',
  );

  execFileSync(
    process.execPath,
    [
      path.resolve('scripts/generate-screen.mjs'),
      '--request-file',
      promptFile,
      '--target',
      tempDir,
      '--name',
      'TrafficHome',
    ],
    { stdio: 'pipe' },
  );

  const blueprint = JSON.parse(
    fs.readFileSync(path.join(tempDir, 'docs', 'screen-specs', 'traffic-home.blueprint.json'), 'utf8'),
  );
  const viewSource = fs.readFileSync(path.join(tempDir, 'src', 'views', 'TrafficHome.vue'), 'utf8');

  assert.equal(blueprint.layoutPattern, 'overview-home');
  assert.ok(Array.isArray(blueprint.blockPriority));
  assert.ok(blueprint.sections.some((section) => section.component === 'MapPanel'));
  assert.doesNotMatch(viewSource, /<style scoped/);
});
