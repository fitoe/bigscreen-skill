import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'bigscreen-revise-'));
}

test('revise-screen script updates blueprint from revision prompt', () => {
  const tempDir = makeTempDir();
  const requestFile = path.join(tempDir, 'request.txt');
  const revisionFile = path.join(tempDir, 'revision.txt');

  fs.writeFileSync(
    requestFile,
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
      requestFile,
      '--target',
      tempDir,
      '--name',
      'TrafficHome',
    ],
    { stdio: 'pipe' },
  );

  fs.writeFileSync(
    revisionFile,
    `把右侧摘要区改成排行和构成，不要太复杂。
底部表格加高一点。
保留首页，不要切换成专题页。`,
    'utf8',
  );

  execFileSync(
    process.execPath,
    [
      path.resolve('scripts/revise-screen.mjs'),
      '--blueprint-file',
      path.join(tempDir, 'docs', 'screen-specs', 'traffic-home.blueprint.json'),
      '--revision-file',
      revisionFile,
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
  const tableSection = blueprint.sections.find((section) => section.purpose === 'table');

  assert.equal(blueprint.layoutPattern, 'overview-home');
  assert.ok(blueprint.sections.some((section) => section.purpose === 'ranking'));
  assert.ok(blueprint.sections.some((section) => section.purpose === 'composition'));
  assert.ok(tableSection.heightPolicy.min >= 300);
  assert.ok(blueprint.heightStrategy.notes.some((note) => /bottom table/i.test(note)));
});
