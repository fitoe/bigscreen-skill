import path from 'node:path';

const sceneKeywordMap = [
  { tag: 'government', patterns: ['政务', '监管', '共享交换'] },
  { tag: 'water', patterns: ['水质', '水务'] },
  { tag: 'epidemic', patterns: ['疫情', '公卫', '传染病'] },
  { tag: 'fire', patterns: ['消防'] },
  { tag: 'community', patterns: ['社区', '惠民'] },
  { tag: 'mining', patterns: ['矿产', '矿山'] },
  { tag: 'manufacturing', patterns: ['生产', '工厂'] },
  { tag: 'energy', patterns: ['能耗', '能源'] },
  { tag: 'traffic', patterns: ['交通', '高速', '车联网', '物流'] },
  { tag: 'retail', patterns: ['门店', '零售', '消费者'] },
  { tag: 'medical', patterns: ['医院'] },
  { tag: 'security', patterns: ['作战', '指挥室', '风险', '监控'] },
  { tag: 'finance', patterns: ['银行', '金融', '信用'] },
  { tag: 'network', patterns: ['网络', '视频'] },
];

const pageTypeKeywordMap = [
  { type: 'alarm-center', patterns: ['告警', '预警', '风险', '督导'] },
  { type: 'map-command-page', patterns: ['指挥室', '交通', '高速', '车联网', '地图'] },
  { type: 'monitoring-analysis', patterns: ['监控', '监测', '能耗', '工地', '分析'] },
  { type: 'overview-home', patterns: ['数据中心', '概览', '平台', '大屏'] },
  { type: 'thematic-cockpit', patterns: ['专题', '监管', '展示', '运营'] },
];

export function getTemplateName(templatePath) {
  return path.basename(templatePath).replace(/^\d+\s*/, '');
}

export function inferSceneTags(templateName) {
  const tags = sceneKeywordMap
    .filter(({ patterns }) => patterns.some((pattern) => templateName.includes(pattern)))
    .map(({ tag }) => tag);
  return tags.length ? tags : ['general'];
}

export function inferPageTypes(templateName) {
  const pageTypes = pageTypeKeywordMap
    .filter(({ patterns }) => patterns.some((pattern) => templateName.includes(pattern)))
    .map(({ type }) => type);
  return pageTypes.length ? [...new Set(pageTypes)] : ['overview-home'];
}

export function collectChartFamilies(text) {
  const families = [];
  if (/type\s*:\s*['"`]line['"`]/i.test(text)) families.push('line');
  if (/type\s*:\s*['"`]bar['"`]/i.test(text)) families.push('bar');
  if (/type\s*:\s*['"`]pie['"`]/i.test(text)) families.push('pie');
  if (/type\s*:\s*['"`]gauge['"`]/i.test(text) || /gauge\d*/i.test(text)) families.push('gauge');
  if (/wordCloud|echarts-wordcloud/i.test(text)) families.push('word-cloud');
  if (/type\s*:\s*['"`]scatter['"`]/i.test(text)) families.push('scatter');
  return families.length ? [...new Set(families)] : ['unknown'];
}

export function collectFeatures(text, templateName = '') {
  return {
    hasMap: /registerMap|geo\s*:|china\.js|document\.getElementById\(['"`]map['"`]\)|id=['"`]map['"`]/i.test(text) || /地图|地理|指挥室|高速|车联网/.test(templateName),
    hasAlarm: /告警|预警|报警|风险|事件|投诉|监控|督导/i.test(templateName) || /\balarm\b|warning|event|risk|complaint/i.test(text),
    hasTable: /<table\b|<thead\b|<tbody\b|easyui-datagrid|data-grid/i.test(text),
    hasLine: /type\s*:\s*['"`]line['"`]/i.test(text),
    hasBar: /type\s*:\s*['"`]bar['"`]/i.test(text),
    hasPie: /type\s*:\s*['"`]pie['"`]/i.test(text),
    hasGauge: /type\s*:\s*['"`]gauge['"`]|gauge\d*/i.test(text),
    darkTone: /#0[0-9a-f]{5}|rgba\(\s*0,\s*[0-4]?\d,\s*[0-6]?\d/i.test(text),
  };
}

export function inferLayoutType(features) {
  if (features.hasMap) return 'center-map-three-column';
  if (features.hasTable && features.hasAlarm) return 'stacked-center-stream';
  return 'bilateral-panels';
}

export function inferTone(features, templateName) {
  if (/作战|告警|预警|风险|疫情/.test(templateName) || features.hasAlarm) return 'dark-alert';
  if (/工厂|能耗|生产/.test(templateName)) return 'cyan-industrial';
  return features.darkTone ? 'deep-blue-glow' : 'light-neutral';
}

export function inferDensity(fileCount, features) {
  if (fileCount >= 12 || (features.hasTable && features.hasMap)) return 'high';
  if (fileCount >= 6 || features.hasTable || features.hasAlarm) return 'medium';
  return 'low';
}

export function inferStrongSections(features) {
  const sections = [];
  if (features.hasMap) sections.push('map-focus');
  if (features.hasLine) sections.push('trend-analysis');
  if (features.hasBar) sections.push('ranking-or-compare');
  if (features.hasPie) sections.push('composition-panel');
  if (features.hasTable) sections.push('data-table');
  if (features.hasAlarm) sections.push('alert-stream');
  return sections.length ? sections : ['header-summary'];
}
