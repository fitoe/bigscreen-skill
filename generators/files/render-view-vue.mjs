function getPageName(file = {}, manifest = {}) {
  const route = manifest.routes?.find((entry) => entry.component === file.path);

  if (route?.pageName) {
    return route.pageName;
  }

  const basename = file.path?.split('/').pop()?.replace(/\.vue$/, '');
  return basename || manifest.projectName || 'GeneratedPage';
}

export function renderViewVue(file = {}, manifest = {}) {
  const pageName = getPageName(file, manifest);

  return `<template>
  <main class="screen-view">
    <h1>{{ title }}</h1>
  </main>
</template>

<script setup>
const title = '${pageName}';
</script>

<style scoped>
.screen-view {
  min-height: 100vh;
  display: grid;
  place-items: center;
  margin: 0;
  background: #06121f;
  color: #f3f7ff;
  font-family: 'Segoe UI', sans-serif;
}
</style>
`;
}
