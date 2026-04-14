import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';

import { generateBlueprint, parseRequestInput } from '../scripts/build-blueprint.mjs';

const templateFeaturesPath = path.resolve('bigscreen-generator/references/template-features.json');

test('parseRequestInput normalizes json requests', () => {
  const request = parseRequestInput(
    JSON.stringify({
      domain: 'traffic',
      pageType: 'map-command-page',
      mustHaveSections: ['map', 'alerts', 'ranking'],
      keyMetrics: ['vehicle count', 'incident count'],
      preferredStyle: 'deep blue command center',
      mapRequired: true,
    }),
  );

  assert.equal(request.domain, 'traffic');
  assert.equal(request.pageType, 'map-command-page');
  assert.deepEqual(request.mustHaveSections, ['map', 'alerts', 'ranking']);
  assert.equal(request.mapRequired, true);
});

test('parseRequestInput supports simplified Chinese prompt input', () => {
  const request = parseRequestInput(`生成一个可运行的大屏首页（Vue3 + ECharts）。
主题：智慧园区
关键指标：在线设备、告警数量、能耗负载
风格：深蓝指挥中心
必须模块：kpi、趋势、地图、排行、告警、表格
数据密度：高`);

  assert.equal(request.domain, '智慧园区');
  assert.equal(request.pageType, 'overview-home');
  assert.equal(request.preferredStyle, '深蓝指挥中心');
  assert.equal(request.dataDensity, 'high');
  assert.deepEqual(request.keyMetrics, ['在线设备', '告警数量', '能耗负载']);
  assert.deepEqual(request.mustHaveSections, ['kpi', 'trend', 'map', 'ranking', 'alerts', 'table']);
});

test('generateBlueprint picks references and components for map command pages', () => {
  const blueprint = generateBlueprint(
    {
      domain: 'traffic',
      pageType: 'map-command-page',
      mustHaveSections: ['map', 'alerts', 'ranking', 'table'],
      keyMetrics: ['vehicle count', 'incident count'],
      preferredStyle: 'deep blue command center',
      mapRequired: true,
      dataDensity: 'high',
    },
    {
      templateFeaturesPath,
      maxReferences: 5,
    },
  );

  assert.equal(blueprint.layoutPattern, 'map-command-page');
  assert.equal(blueprint.referenceTemplates.length, 5);
  assert.ok(blueprint.referenceTemplates.some((item) => item.pageTypes.includes('map-command-page')));
  assert.ok(blueprint.referenceTemplates.some((item) => item.sceneTags.includes('traffic') || item.sceneTags.includes('security')));
  assert.ok(blueprint.sections.some((section) => section.component === 'MapPanel'));
  assert.ok(blueprint.sections.some((section) => section.component === 'AlarmTicker'));
  assert.ok(blueprint.sections.some((section) => section.component === 'RankingList'));
  assert.ok(blueprint.sections.some((section) => section.component === 'ScrollTable'));
});

test('generateBlueprint emits priority and height strategy metadata', () => {
  const blueprint = generateBlueprint(
    `Generate a runnable big screen home page.
Domain: traffic
Page type: map-command-page
Must modules: kpi, map, trend, ranking, alerts, table
Style: deep blue command center
Data density: high`,
    {
      templateFeaturesPath,
      maxReferences: 3,
    },
  );

  assert.ok(Array.isArray(blueprint.blockPriority));
  assert.ok(blueprint.blockPriority.length > 0);
  assert.ok(blueprint.heightStrategy);
  assert.equal(typeof blueprint.heightStrategy.overall, 'string');
  assert.ok(blueprint.sections.every((section) => typeof section.priority === 'number'));
  assert.ok(
    blueprint.sections.every((section) => section.heightPolicy && Object.hasOwn(section.heightPolicy, 'min')),
  );
  assert.ok(blueprint.sections.some((section) => section.heightPolicy.autoRotate === true));
  assert.ok(blueprint.sections.some((section) => section.heightPolicy.scroll === true));
});
