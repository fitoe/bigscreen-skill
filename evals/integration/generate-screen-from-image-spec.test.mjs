import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

test('generate-screen-from-image-spec builds a manifest-first project', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bigscreen-image-'));
  const imageSpecFile = path.join(tempDir, 'image-spec.json');

  fs.writeFileSync(
    imageSpecFile,
    JSON.stringify({
      topic: '智慧园区',
      pageType: 'overview-home',
      style: '深蓝指挥中心',
      keyMetrics: ['在线设备', '告警数量', '能耗负载'],
      layoutNarrative: ['左侧指标', '中间地图', '右侧告警'],
      mustModules: ['kpi', 'map', 'alerts', 'table'],
    }),
  );

  const result = spawnSync(
    'node',
    ['scripts/generate-screen-from-image-spec.mjs', '--input-file', imageSpecFile, '--target', tempDir],
    { encoding: 'utf8' },
  );

  assert.equal(result.status, 0);
  assert.equal(fs.existsSync(path.join(tempDir, 'index.html')), true);
  assert.equal(fs.existsSync(path.join(tempDir, 'src', 'main.ts')), true);
  assert.equal(fs.existsSync(path.join(tempDir, 'docs', 'screen-specs')), true);
});
