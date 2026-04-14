export function renderMainTs(manifest = {}) {
  const hasRoutes = Array.isArray(manifest.routes) && manifest.routes.length > 0;

  if (hasRoutes) {
    return `import { createApp } from 'vue';
import router from './router';

const app = createApp({
  template: '<router-view />',
});

app.use(router);
app.mount('#app');
`;
  }

  const componentPath = manifest.routes?.[0]?.component ?? 'src/views/GeneratedPage.vue';
  const importPath = `./${componentPath.replace(/^src\//, '')}`;

  return `import { createApp } from 'vue';
import App from '${importPath}';

createApp(App).mount('#app');
`;
}
