import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { generateProject } from '../../generators/project/generate-project.mjs';

test('generateProject writes a runnable Vue project skeleton from a manifest', async () => {
  const target = fs.mkdtempSync(path.join(os.tmpdir(), 'bigscreen-harness-'));

  await generateProject(
    {
      projectName: 'GeneratedOverview',
      routes: [
        {
          path: '/',
          pageName: 'GeneratedOverview',
          component: 'src/views/GeneratedOverview.vue',
        },
      ],
      files: [
        { path: 'index.html', kind: 'html' },
        { path: 'package.json', kind: 'config' },
        { path: 'vite.config.ts', kind: 'config' },
        { path: 'src/main.ts', kind: 'entry' },
        { path: 'src/router/index.ts', kind: 'router' },
        { path: 'src/views/GeneratedOverview.vue', kind: 'view' },
      ],
    },
    { target },
  );

  assert.equal(fs.existsSync(path.join(target, 'index.html')), true);
  assert.equal(fs.existsSync(path.join(target, 'package.json')), true);
  assert.equal(fs.existsSync(path.join(target, 'vite.config.ts')), true);
  assert.equal(fs.existsSync(path.join(target, 'src', 'main.ts')), true);
  assert.equal(fs.existsSync(path.join(target, 'src', 'router', 'index.ts')), true);
  assert.equal(fs.existsSync(path.join(target, 'src', 'views', 'GeneratedOverview.vue')), true);

  const indexHtml = fs.readFileSync(path.join(target, 'index.html'), 'utf8');
  assert.match(indexHtml, /<div id="app"><\/div>/);
  assert.match(indexHtml, /src="\/src\/main\.ts"/);

  const packageJson = JSON.parse(fs.readFileSync(path.join(target, 'package.json'), 'utf8'));
  assert.equal(packageJson.name, 'generated-overview');
  assert.equal(packageJson.private, true);
  assert.equal(packageJson.scripts.dev, 'vite');
  assert.equal(packageJson.scripts.build, 'vite build');
  assert.equal(packageJson.dependencies.vue, '^3.5.13');
  assert.equal(packageJson.dependencies['vue-router'], '^4.5.1');
  assert.equal(packageJson.devDependencies.vite, '^5.4.10');

  const viteConfig = fs.readFileSync(path.join(target, 'vite.config.ts'), 'utf8');
  assert.match(viteConfig, /@vitejs\/plugin-vue/);
  assert.match(viteConfig, /defineConfig/);

  const mainTs = fs.readFileSync(path.join(target, 'src', 'main.ts'), 'utf8');
  assert.match(mainTs, /createApp/);
  assert.match(mainTs, /router-view/);
  assert.match(mainTs, /app\.use\(router\)/);
  assert.match(mainTs, /\.mount\('#app'\)/);

  const routerTs = fs.readFileSync(path.join(target, 'src', 'router', 'index.ts'), 'utf8');
  assert.match(routerTs, /createRouter/);
  assert.match(routerTs, /createWebHistory/);
  assert.match(routerTs, /GeneratedOverview/);
  assert.match(routerTs, /path: '\/'/);

  const viewVue = fs.readFileSync(path.join(target, 'src', 'views', 'GeneratedOverview.vue'), 'utf8');
  assert.match(viewVue, /<template>/);
  assert.match(viewVue, /GeneratedOverview/);
  assert.match(viewVue, /<script setup>/);
});
