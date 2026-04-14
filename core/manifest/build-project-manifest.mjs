export function buildProjectManifest(blueprint) {
  const rawPageName = typeof blueprint?.pageName === 'string' ? blueprint.pageName.trim() : '';
  const pageName = rawPageName || 'GeneratedPage';

  return {
    projectName: pageName,
    routes: [
      {
        path: '/',
        pageName,
        component: `src/views/${pageName}.vue`,
      },
    ],
    files: [
      { path: 'index.html', kind: 'html' },
      { path: 'package.json', kind: 'config' },
      { path: 'vite.config.ts', kind: 'config' },
      { path: 'src/main.ts', kind: 'entry' },
      { path: 'src/router/index.ts', kind: 'router' },
      { path: `src/views/${pageName}.vue`, kind: 'view' },
    ],
  };
}
