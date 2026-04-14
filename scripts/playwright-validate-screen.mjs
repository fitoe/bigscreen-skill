#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import http from 'node:http';
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

function toSlug(value) {
  return String(value)
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/\s+/g, '-')
    .toLowerCase();
}

export function buildValidationOutputDir(options = {}) {
  if (options.outputDir) return path.resolve(options.outputDir);

  const target = options.target ? path.resolve(options.target) : process.cwd();
  const slug = toSlug(path.basename(target)) || 'screen';
  return path.join(os.tmpdir(), 'bigscreen-skill', 'playwright-artifacts', slug);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForHttp(url, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(url, (res) => {
          res.resume();
          if (res.statusCode && res.statusCode < 500) resolve(true);
          else reject(new Error(`HTTP ${res.statusCode}`));
        });
        req.on('error', reject);
      });
      return;
    } catch {
      await sleep(600);
    }
  }
  throw new Error(`Timed out waiting for ${url}`);
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: options.stdio || 'inherit',
      cwd: options.cwd,
      shell: process.platform === 'win32',
      env: { ...process.env, ...options.env },
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolve(child);
      else reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`));
    });
  });
}

function startCommand(command, args, options = {}) {
  return spawn(command, args, {
    stdio: options.stdio || 'pipe',
    cwd: options.cwd,
    shell: process.platform === 'win32',
    env: { ...process.env, ...options.env },
  });
}

function readJsonIfExists(file) {
  if (!file || !fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function getLatestBlueprint(target) {
  const docsDir = path.join(target, 'docs', 'screen-specs');
  if (!fs.existsSync(docsDir)) return null;
  const files = fs.readdirSync(docsDir).filter((file) => file.endsWith('.blueprint.json'));
  if (!files.length) return null;
  const sorted = files
    .map((file) => ({ file, mtime: fs.statSync(path.join(docsDir, file)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);
  return path.join(docsDir, sorted[0].file);
}

function deriveExpectedReferenceChecks(referenceSpec = {}) {
  const prompt = (referenceSpec || {}).structuredPrompt || referenceSpec || {};
  const mustModules = Array.isArray(prompt.mustModules) ? prompt.mustModules : [];
  const layoutNarrative = Array.isArray(prompt.layoutNarrative) ? prompt.layoutNarrative.join('；') : String(prompt.layoutNarrative || '');
  const panelChrome = prompt.panelChrome || {};

  return {
    expectedModules: mustModules,
    expectedChrome: panelChrome.variant || '',
    centerShouldHaveMap: /中.*地图|center.*map|主视觉.*地图|map.*主视觉/i.test(layoutNarrative),
    bottomShouldHaveTable: /底部.*表格|bottom.*table|底部.*台账/i.test(layoutNarrative),
    leftHasSummary: /左.*(kpi|数据|统计|排行|table|表格)/i.test(layoutNarrative),
    rightHasSummary: /右.*(摘要|评价|排行|表格|summary|ranking|table)/i.test(layoutNarrative),
  };
}

export function evaluateBrowserSnapshot(snapshot, blueprint = null, referenceSpec = null) {
  const findings = [];
  const warnings = [];
  const passes = [];

  if (!snapshot.pageFitsViewport) findings.push('Page overflows the viewport; full-screen fit failed.');
  else passes.push('Page fits the viewport without page-level overflow.');

  if (snapshot.verticalScrollbar) findings.push('Page-level vertical scrolling is present.');
  else passes.push('No page-level vertical scrollbar detected.');

  if (snapshot.horizontalScrollbar) findings.push('Page-level horizontal scrolling is present.');

  if (snapshot.outOfBoundsPanels.length) {
    findings.push(`Detected ${snapshot.outOfBoundsPanels.length} panel(s) extending outside the viewport.`);
  }

  if (snapshot.minFontSize < 12) {
    findings.push(`Minimum visible font size is too low (${snapshot.minFontSize}px).`);
  } else if (snapshot.minFontSize < 14) {
    warnings.push(`Minimum visible font size is marginal (${snapshot.minFontSize}px).`);
  } else {
    passes.push(`Minimum visible font size is acceptable (${snapshot.minFontSize}px).`);
  }

  if (snapshot.tableVisibleRows.length) {
    const lowTable = snapshot.tableVisibleRows.find((item) => item.rows < 3);
    if (lowTable) findings.push(`A table shows too few visible rows (${lowTable.rows}).`);
    else passes.push('Visible table rows meet the minimum threshold.');

    const missingScroll = snapshot.tableVisibleRows.find((item) => item.shouldScroll && !item.scrollable);
    if (missingScroll) findings.push('A table should scroll or auto-rotate based on its content volume, but scrolling is not enabled.');
  }

  if (snapshot.panelOverflowCount > 0) {
    findings.push(`Detected ${snapshot.panelOverflowCount} panel content area(s) overflow their assigned layout box.`);
  }

  if (snapshot.rootLayout?.bodyCutOff || snapshot.rootLayout?.viewportHeightMismatch) {
    findings.push('Main layout appears cropped because the header height was not correctly accounted for before body sizing.');
  }

  if ((snapshot.rootLayout?.shellPaddingX ?? 0) < 16 || (snapshot.rootLayout?.shellPaddingY ?? 0) < 16) {
    warnings.push('Dashboard outer margin is too small; main content is pressed too close to the viewport edge.');
  }

  if (snapshot.fixedCardGroups?.length) {
    const clippedGroup = snapshot.fixedCardGroups.find((group) => group.clipped > 0);
    if (clippedGroup) findings.push('A fixed-count card group is clipped instead of being resized to remain fully visible.');

    const sparseGroup = snapshot.fixedCardGroups.find((group) => group.verticalCoverage < 0.8);
    if (sparseGroup) warnings.push('A fixed-count card group is not evenly distributed vertically, leaving avoidable blank space.');
  }

  if (snapshot.mapCenterOffset && (Math.abs(snapshot.mapCenterOffset.x) > 0.12 || Math.abs(snapshot.mapCenterOffset.y) > 0.12)) {
    warnings.push('The map is visibly off-center inside its container.');
  }

  if (snapshot.chartLegendOverlaps > 0) {
    warnings.push('At least one chart and legend overlap; the composition should reflow before compressing content.');
  }

  const priorityPurpose = blueprint?.blockPriority?.[0];
  if (priorityPurpose === 'map' && snapshot.largestRole !== 'map-panel') {
    warnings.push(`Primary blueprint role is map, but largest visible module is ${snapshot.largestRole || 'unknown'}.`);
  }
  if (priorityPurpose === 'trend' && !['chart', 'map-panel'].includes(snapshot.largestRole || '')) {
    warnings.push(`Primary blueprint role is trend, but largest visible module is ${snapshot.largestRole || 'unknown'}.`);
  }

  const expected = deriveExpectedReferenceChecks(referenceSpec);
  if (expected.expectedChrome && snapshot.panelChrome && expected.expectedChrome !== snapshot.panelChrome) {
    warnings.push(`Panel chrome differs from reference expectation (${snapshot.panelChrome} vs ${expected.expectedChrome}).`);
  }
  if (expected.expectedModules.includes('map') && !snapshot.roleCounts['map-panel']) {
    findings.push('Reference expects a map module, but no rendered map panel was detected.');
  }
  if (expected.centerShouldHaveMap && snapshot.roleZones['map-panel'] !== 'center') {
    warnings.push('Reference suggests a center-dominant map, but the map is not centered.');
  }
  if (expected.bottomShouldHaveTable && snapshot.roleZones['scroll-table'] !== 'bottom') {
    warnings.push('Reference suggests a bottom table/ledger, but the table is not placed at the bottom band.');
  }
  if (expected.leftHasSummary && !snapshot.bandRoles.left.length) {
    warnings.push('Reference suggests left-side summary content, but no left-band modules were detected.');
  }
  if (expected.rightHasSummary && !snapshot.bandRoles.right.length) {
    warnings.push('Reference suggests right-side summary content, but no right-band modules were detected.');
  }

  return {
    status: findings.length ? 'fail' : warnings.length ? 'warn' : 'pass',
    findings,
    warnings,
    passes,
  };
}

export async function runPlaywrightValidation(options) {
  const {
    target,
    referenceSpecFile,
    referenceImage,
    port = 4173,
    outputDir,
    installDeps = false,
  } = options;

  let playwright;
  try {
    playwright = await import('playwright');
  } catch {
    throw new Error('Playwright is not installed in the current workspace. Install it when needed with `npm install -D playwright`.');
  }

  if (installDeps && !fs.existsSync(path.join(target, 'node_modules'))) {
    await runCommand('npm', ['install'], { cwd: target });
  }

  const server = startCommand('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port)], {
    cwd: target,
    stdio: 'pipe',
  });
  server.stdout?.on('data', () => {});
  server.stderr?.on('data', () => {});

  const baseUrl = `http://127.0.0.1:${port}`;
  try {
    await waitForHttp(baseUrl, 30000);
    fs.mkdirSync(outputDir, { recursive: true });

    const browser = await playwright.chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(outputDir, 'playwright-screen.png'), fullPage: false });

    const snapshot = await page.evaluate(() => {
      function asHTMLElement(node) {
        return node instanceof HTMLElement ? node : null;
      }

      function zoneFromRect(rect, viewport) {
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const horizontal = centerX < viewport.width / 3 ? 'left' : centerX > (viewport.width * 2) / 3 ? 'right' : 'center';
        const vertical = centerY < viewport.height / 3 ? 'top' : centerY > (viewport.height * 2) / 3 ? 'bottom' : 'middle';
        return { horizontal, vertical };
      }

      const doc = document.documentElement;
      const viewport = { width: window.innerWidth, height: window.innerHeight };
      const pageFitsViewport = doc.scrollHeight <= viewport.height + 1 && doc.scrollWidth <= viewport.width + 1;
      const panelChrome = document.querySelector('[data-panel-chrome]')?.getAttribute('data-panel-chrome') || '';
      const shellNode = asHTMLElement(document.querySelector('[data-bigscreen-role="screen-shell"]'));
      const shellStyle = shellNode ? getComputedStyle(shellNode) : null;
      const headerNode = asHTMLElement(document.querySelector('header'));

      const panels = [...document.querySelectorAll('[data-panel-card]')].map((node) => {
        const rect = node.getBoundingClientRect();
        const element = asHTMLElement(node);
        return {
          left: rect.left,
          top: rect.top,
          right: rect.right,
          bottom: rect.bottom,
          width: rect.width,
          height: rect.height,
          overflows: element ? element.scrollHeight > element.clientHeight + 1 || element.scrollWidth > element.clientWidth + 1 : false,
        };
      });

      const outOfBoundsPanels = panels.filter(
        (panel) => panel.left < -1 || panel.top < -1 || panel.right > viewport.width + 1 || panel.bottom > viewport.height + 1,
      );
      const panelOverflowCount = panels.filter((panel) => panel.overflows).length;

      const visibleTextNodes = [...document.querySelectorAll('body *')]
        .filter((node) => node instanceof HTMLElement && node.innerText?.trim())
        .map((node) => Number.parseFloat(getComputedStyle(node).fontSize))
        .filter((size) => Number.isFinite(size));

      const roleElements = [...document.querySelectorAll('[data-bigscreen-role]')]
        .map((node) => {
          const role = node.getAttribute('data-bigscreen-role') || '';
          const rect = node.getBoundingClientRect();
          const zone = zoneFromRect(rect, viewport);
          return {
            role,
            area: rect.width * rect.height,
            zone,
            rect: { width: rect.width, height: rect.height },
          };
        })
        .filter((item) => item.rect.width > 0 && item.rect.height > 0);

      const largestRole = roleElements.slice().sort((a, b) => b.area - a.area)[0]?.role || null;
      const roleCounts = Object.fromEntries(roleElements.reduce((acc, item) => acc.set(item.role, (acc.get(item.role) || 0) + 1), new Map()));
      const roleZones = Object.fromEntries(
        [...new Set(roleElements.map((item) => item.role))].map((role) => {
          const item = roleElements
            .filter((entry) => entry.role === role)
            .sort((a, b) => b.area - a.area)[0];
          return [role, item?.zone.vertical === 'middle' ? item.zone.horizontal : item.zone.vertical];
        }),
      );

      const bandRoles = {
        left: roleElements.filter((item) => item.zone.horizontal === 'left').map((item) => item.role),
        center: roleElements.filter((item) => item.zone.horizontal === 'center').map((item) => item.role),
        right: roleElements.filter((item) => item.zone.horizontal === 'right').map((item) => item.role),
        bottom: roleElements.filter((item) => item.zone.vertical === 'bottom').map((item) => item.role),
      };

      const tableVisibleRows = [...document.querySelectorAll('[data-bigscreen-role="scroll-table"]')].map((table) => {
        const tableElement = asHTMLElement(table);
        const viewportNode = table.querySelector('[data-table-viewport]');
        const cells = [...table.querySelectorAll('[data-table-cell]')];
        const uniqueTops = [...new Set(cells.map((cell) => Math.round(cell.getBoundingClientRect().top)))];
        const scrollableHost = viewportNode || tableElement;
        return {
          rows: Math.max(0, uniqueTops.length),
          viewportHeight: viewportNode?.getBoundingClientRect().height || 0,
          scrollable: Boolean(scrollableHost && scrollableHost.scrollHeight > scrollableHost.clientHeight + 1),
          shouldScroll: Boolean(scrollableHost && uniqueTops.length > 6),
        };
      });

      const mapNode = asHTMLElement(document.querySelector('[data-bigscreen-role="map-panel"]'));
      const mapRect = mapNode?.getBoundingClientRect();
      const mapCenterOffset = mapRect
        ? {
            x: (mapRect.left + mapRect.width / 2 - viewport.width / 2) / viewport.width,
            y: (mapRect.top + mapRect.height / 2 - viewport.height / 2) / viewport.height,
          }
        : null;

      const fixedCardGroups = [...document.querySelectorAll('[data-bigscreen-role]')]
        .reduce((acc, node) => {
          const element = asHTMLElement(node);
          const role = node.getAttribute('data-bigscreen-role') || '';
          if (!element || !role) return acc;
          const parent = element.parentElement;
          if (!parent) return acc;
          const key = `${role}::${[...parent.children].filter((child) => child.getAttribute?.('data-bigscreen-role') === role).length}`;
          if (![4, 5, 6, 8].includes(Number(key.split('::')[1]))) return acc;
          if (!acc.has(parent)) acc.set(parent, { role, items: [] });
          acc.get(parent).items.push(element);
          return acc;
        }, new Map())
        .values()
        .map((group) => {
          const parentRect = group.items[0]?.parentElement?.getBoundingClientRect();
          const tops = group.items.map((item) => item.getBoundingClientRect().top).sort((a, b) => a - b);
          const bottoms = group.items.map((item) => item.getBoundingClientRect().bottom);
          const clipped = group.items.filter((item) => {
            const rect = item.getBoundingClientRect();
            return rect.bottom > (parentRect?.bottom || 0) + 1 || rect.right > (parentRect?.right || 0) + 1;
          }).length;
          return {
            role: group.role,
            total: group.items.length,
            clipped,
            verticalCoverage: parentRect ? (Math.max(...bottoms) - Math.min(...tops)) / Math.max(parentRect.height, 1) : 1,
          };
        });

      const chartLegendOverlaps = [...document.querySelectorAll('[data-bigscreen-role="chart"]')]
        .reduce((count, chartNode) => {
          const chartRect = chartNode.getBoundingClientRect();
          const legends = [...chartNode.parentElement?.querySelectorAll('[class*="legend"], [data-chart-legend]') || []];
          const overlaps = legends.some((legend) => {
            const rect = legend.getBoundingClientRect();
            return !(rect.right < chartRect.left || rect.left > chartRect.right || rect.bottom < chartRect.top || rect.top > chartRect.bottom);
          });
          return count + (overlaps ? 1 : 0);
        }, 0);

      const bodyPanels = panels.length ? Math.max(...panels.map((panel) => panel.bottom)) : 0;
      const rootLayout = {
        shellPaddingX: shellStyle ? Number.parseFloat(shellStyle.paddingLeft) + Number.parseFloat(shellStyle.paddingRight) : 0,
        shellPaddingY: shellStyle ? Number.parseFloat(shellStyle.paddingTop) + Number.parseFloat(shellStyle.paddingBottom) : 0,
        headerHeight: headerNode?.getBoundingClientRect().height || 0,
        bodyCutOff: bodyPanels > viewport.height + 1,
        viewportHeightMismatch: Boolean(shellNode && Math.abs(shellNode.getBoundingClientRect().height - viewport.height) > 2),
      };

      return {
        viewport,
        pageFitsViewport,
        verticalScrollbar: doc.scrollHeight > viewport.height + 1,
        horizontalScrollbar: doc.scrollWidth > viewport.width + 1,
        panelChrome,
        outOfBoundsPanels,
        panelOverflowCount,
        minFontSize: visibleTextNodes.length ? Math.min(...visibleTextNodes) : 0,
        largestRole,
        roleCounts,
        roleZones,
        bandRoles,
        tableVisibleRows,
        rootLayout,
        mapCenterOffset,
        fixedCardGroups,
        chartLegendOverlaps,
      };
    });

    const blueprintFile = getLatestBlueprint(target);
    const blueprint = readJsonIfExists(blueprintFile);
    const referenceSpec = readJsonIfExists(referenceSpecFile);
    const evaluation = evaluateBrowserSnapshot(snapshot, blueprint, referenceSpec);

    const report = {
      generatedAt: new Date().toISOString(),
      target,
      url: baseUrl,
      referenceImage: referenceImage || null,
      blueprintFile,
      snapshot,
      evaluation,
    };

    fs.mkdirSync(outputDir, { recursive: true });
    const reportPath = path.join(outputDir, 'playwright-validation.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');

    await browser.close();
    return { report, reportPath };
  } finally {
    server.kill();
  }
}

const args = parseArgs(process.argv);
const target = args.target ? path.resolve(args.target) : null;
const isMainModule = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMainModule) {
  if (!target) {
    console.error('Usage: node scripts/playwright-validate-screen.mjs --target <project-path> [--reference-spec-file file] [--reference-image file] [--install-deps] [--output-dir dir] [--cleanup]');
    process.exit(1);
  }

  const outputDir = buildValidationOutputDir({
    target,
    outputDir: args['output-dir'] ? path.resolve(args['output-dir']) : null,
  });

  try {
    const { report, reportPath } = await runPlaywrightValidation({
      target,
      referenceSpecFile: args['reference-spec-file'] ? path.resolve(args['reference-spec-file']) : null,
      referenceImage: args['reference-image'] ? path.resolve(args['reference-image']) : null,
      outputDir,
      port: args.port ? Number(args.port) : 4173,
      installDeps: Boolean(args['install-deps']),
    });

    const shouldCleanup = Boolean(args.cleanup);
    console.log(
      shouldCleanup
        ? `Playwright validation ${report.evaluation.status}: temporary artifacts cleaned`
        : `Playwright validation ${report.evaluation.status}: ${reportPath}`,
    );
    for (const item of report.evaluation.findings) console.log(`FAIL: ${item}`);
    for (const item of report.evaluation.warnings) console.log(`WARN: ${item}`);
    for (const item of report.evaluation.passes) console.log(`PASS: ${item}`);
    if (shouldCleanup) fs.rmSync(outputDir, { recursive: true, force: true });
    if (report.evaluation.status === 'fail') process.exit(2);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
