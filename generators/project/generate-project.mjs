import fs from 'node:fs/promises';
import path from 'node:path';

import { renderPackageJson } from '../files/render-package-json.mjs';
import { renderViteConfig } from '../files/render-vite-config.mjs';
import { renderMainTs } from '../files/render-main-ts.mjs';
import { renderIndexHtml } from '../files/render-index-html.mjs';
import { renderRouterIndex } from '../files/render-router-index.mjs';
import { renderViewVue } from '../files/render-view-vue.mjs';

function renderFile(file, manifest) {
  if (file.path === 'index.html') {
    return renderIndexHtml(manifest);
  }

  if (file.path === 'package.json') {
    return renderPackageJson(manifest);
  }

  if (file.path === 'vite.config.ts') {
    return renderViteConfig(manifest);
  }

  if (file.path === 'src/main.ts') {
    return renderMainTs(manifest);
  }

  if (file.path === 'src/router/index.ts') {
    return renderRouterIndex(manifest);
  }

  if (file.kind === 'view') {
    return renderViewVue(file, manifest);
  }

  throw new Error(`Unsupported manifest file: ${file.path}`);
}

export async function generateProject(manifest, { target }) {
  for (const file of manifest?.files ?? []) {
    const outputPath = path.join(target, file.path);
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, renderFile(file, manifest), 'utf8');
  }
}
