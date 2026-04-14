function toPackageName(value) {
  const normalized = typeof value === 'string' ? value.trim() : '';

  return (normalized || 'generated-project')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

export function renderPackageJson(manifest = {}) {
  return `${JSON.stringify(
    {
      name: toPackageName(manifest.projectName),
      private: true,
      version: '0.0.0',
      type: 'module',
      scripts: {
        dev: 'vite',
        build: 'vite build',
        preview: 'vite preview',
      },
      dependencies: {
        vue: '^3.5.13',
        'vue-router': '^4.5.1',
      },
      devDependencies: {
        '@vitejs/plugin-vue': '^5.1.4',
        vite: '^5.4.10',
      },
    },
    null,
    2,
  )}
`;
}
