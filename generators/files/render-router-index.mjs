function toImportName(componentPath = '') {
  const base = componentPath.split('/').pop()?.replace(/\.vue$/, '') || 'Page';
  const safe = base.replace(/[^a-zA-Z0-9]+/g, ' ').trim();
  const parts = safe.split(/\s+/).filter(Boolean);
  const pascal = parts.map((part) => part[0].toUpperCase() + part.slice(1)).join('');
  return pascal || 'Page';
}

function toRelativeImport(componentPath = '') {
  const cleaned = componentPath.replace(/^src\//, '');
  return `../${cleaned}`;
}

export function renderRouterIndex(manifest = {}) {
  const routes = Array.isArray(manifest.routes) ? manifest.routes : [];
  const imports = routes
    .map((route) => {
      const name = toImportName(route.component);
      const path = toRelativeImport(route.component);
      return { name, path };
    })
    .filter((entry) => entry.name && entry.path);

  const importLines = imports
    .map((entry) => `import ${entry.name} from '${entry.path}';`)
    .join('\n');

  const routeLines = routes
    .map((route) => {
      const name = toImportName(route.component);
      return `  { path: '${route.path ?? '/'}', component: ${name} },`;
    })
    .join('\n');

  return `${importLines}
import { createRouter, createWebHistory } from 'vue-router';

const routes = [
${routeLines}
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
`;
}
