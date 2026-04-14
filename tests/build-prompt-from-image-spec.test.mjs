import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { buildPromptFromImageSpec } from '../scripts/build-prompt-from-image-spec.mjs';

test('buildPromptFromImageSpec creates stable prompt package from image spec', () => {
  const input = JSON.parse(
    fs.readFileSync(path.resolve('tests/fixtures/inclusive-finance-image-spec.json'), 'utf8'),
  );

  const result = buildPromptFromImageSpec(input);

  assert.ok(Array.isArray(result.imageAnalysisSummary));
  assert.match(result.imageAnalysisSummary.join('\n'), /保留布局节奏与模块外壳/);
  assert.equal(result.structuredPrompt.topic, '普惠金融数据可视化大屏');
  assert.equal(result.structuredPrompt.pageType, 'overview-home');
  assert.ok(result.structuredPrompt.mustModules.includes('map'));
  assert.equal(result.structuredPrompt.panelChrome.variant, 'command-angled');
  assert.match(result.naturalPrompt, /普惠金融数据可视化大屏/);
  assert.match(result.naturalPrompt, /保留模板式模块边框、标题栏背景、发光描边/);
  assert.match(result.naturalPrompt, /左列为数据服务统计、数据项表格、接口调用排行/);
  assert.match(result.naturalPrompt, /地图必须是最大主视觉/);
});
