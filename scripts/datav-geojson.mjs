const DATAV_BASE = 'https://geo.datav.aliyun.com/areas_v3/bound';

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

function normalizeAreaName(name) {
  return String(name || '')
    .trim()
    .replace(/\s+/g, '')
    .replace(/壮族自治区|回族自治区|维吾尔自治区|特别行政区|自治区/g, '')
    .replace(/自治州/g, '州');
}

function inferLevelFromName(name) {
  if (/省|自治区|特别行政区/.test(name)) return 'province';
  if (/市|自治州|州|盟/.test(name)) return 'city';
  if (/区|县|旗/.test(name)) return 'district';
  return 'city';
}

function inferLevelFromCode(code) {
  const text = String(code || '');
  if (!text || text.length < 6) return 'city';
  if (text.slice(2) === '0000') return 'province';
  if (text.slice(4) === '00') return 'city';
  return 'district';
}

function needsFullBoundary(level) {
  return level === 'province' || level === 'city';
}

function buildBoundaryUrl(adcode, level) {
  return `${DATAV_BASE}/${adcode}${needsFullBoundary(level) ? '_full' : ''}.json`;
}

function extractProperties(feature) {
  const properties = feature?.properties || {};
  return {
    name: String(properties.name || properties.NAME || ''),
    adcode: String(properties.adcode || properties.id || properties.code || ''),
  };
}

function parseAreaNames(text) {
  const source = String(text || '');
  const matches = source.match(/[\u4e00-\u9fa5]{2,}?(?:特别行政区|自治区|自治州|省|市|区|县|旗|盟|州)/g) || [];
  return unique(
    matches
      .map((name) => name.replace(/^(请使用|使用|采用|选择|展示|显示|切换到)/u, ''))
      .filter((name) => !/园区|校区|景区|社区|街区|片区|图区|战区|厂区/u.test(name)),
  );
}

function extractPromptValue(text, keys) {
  const lines = String(text || '').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    for (const key of keys) {
      const match = trimmed.match(new RegExp(`^${key}\\s*[:：]\\s*(.+)$`, 'i'));
      if (match) return match[1].trim();
    }
  }
  return '';
}

export function extractMapTargetHint(input) {
  const source = typeof input === 'string' ? { originalPrompt: input } : input || {};
  const prompt = String(source.originalPrompt || '');
  const explicitUrl = prompt.match(/areas_v3\/bound\/(\d+)(?:_full)?\.json/i);
  const explicitAdcode = firstNonEmpty([source.mapAdcode, explicitUrl?.[1], prompt.match(/\b\d{6}\b/)?.[0]]);
  const labeledRegion = firstNonEmpty([
    source.mapRegion,
    extractPromptValue(prompt, ['地图区域', '地图地区', '行政区', '区域范围', '地图编码区域']),
  ]);
  const names = unique([
    ...normalizeArray(source.mapRegionPath),
    ...parseAreaNames(labeledRegion),
    ...parseAreaNames(prompt),
  ]);

  if (!explicitAdcode && !names.length) return null;

  return {
    adcode: explicitAdcode || '',
    names,
    displayName: names[names.length - 1] || '',
    level: explicitAdcode ? inferLevelFromCode(explicitAdcode) : inferLevelFromName(names[names.length - 1] || ''),
  };
}

function normalizeArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return String(value)
    .split(/[,，、/]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function firstNonEmpty(values) {
  return values.find((value) => String(value || '').trim()) || '';
}

async function fetchJson(url, fetchImpl) {
  const response = await fetchImpl(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  return response.json();
}

function findFeatureByName(collection, targetName) {
  const wanted = normalizeAreaName(targetName);
  return (collection?.features || []).find((feature) => {
    const { name } = extractProperties(feature);
    const normalized = normalizeAreaName(name);
    return normalized === wanted || normalized.replace(/[省市区县旗盟州]$/u, '') === wanted.replace(/[省市区县旗盟州]$/u, '');
  });
}

async function resolveFromHierarchy(names, fetchImpl) {
  let current = { adcode: '100000', level: 'country', name: '中国' };

  for (const name of names) {
    const collection = await fetchJson(buildBoundaryUrl(current.adcode, 'province'), fetchImpl);
    const directMatch = findFeatureByName(collection, name);
    if (directMatch) {
      const { adcode, name: matchedName } = extractProperties(directMatch);
      current = {
        adcode,
        level: inferLevelFromName(matchedName || name),
        name: matchedName || name,
      };
      continue;
    }

    if (current.adcode !== '100000') return null;

    for (const province of collection.features || []) {
      const provinceInfo = extractProperties(province);
      if (!provinceInfo.adcode) continue;
      const provinceChildren = await fetchJson(buildBoundaryUrl(provinceInfo.adcode, 'province'), fetchImpl);
      const nestedMatch = findFeatureByName(provinceChildren, name);
      if (!nestedMatch) continue;

      const { adcode, name: matchedName } = extractProperties(nestedMatch);
      current = {
        adcode,
        level: inferLevelFromName(matchedName || name),
        name: matchedName || name,
      };
      break;
    }
  }

  return current.adcode && current.adcode !== '100000' ? current : null;
}

export async function resolveDatavMapTarget(hint, fetchImpl = fetch) {
  if (!hint) return null;

  if (hint.adcode) {
    const level = hint.level || inferLevelFromCode(hint.adcode);
    return {
      adcode: String(hint.adcode),
      name: hint.displayName || '',
      level,
      sourceUrl: buildBoundaryUrl(hint.adcode, level),
      assetFileName: `${hint.adcode}${needsFullBoundary(level) ? '_full' : ''}.geojson.json`,
    };
  }

  const current = await resolveFromHierarchy(hint.names || [], fetchImpl);
  if (!current.adcode || current.adcode === '100000') return null;

  return {
    adcode: current.adcode,
    name: current.name,
    level: current.level,
    sourceUrl: buildBoundaryUrl(current.adcode, current.level),
    assetFileName: `${current.adcode}${needsFullBoundary(current.level) ? '_full' : ''}.geojson.json`,
  };
}

export async function downloadDatavGeoJson(targetFile, resolvedTarget, fetchImpl = fetch) {
  if (!resolvedTarget?.sourceUrl) return null;
  const payload = await fetchJson(resolvedTarget.sourceUrl, fetchImpl);
  return {
    filePath: targetFile,
    json: payload,
  };
}
