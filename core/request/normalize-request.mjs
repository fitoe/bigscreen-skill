export function normalizeRequest(input = {}) {
  const requiredModules = Array.isArray(input.requiredModules)
    ? input.requiredModules
        .map((moduleName) => (typeof moduleName === 'string' ? moduleName.trim() : ''))
        .filter(Boolean)
    : [];

  return {
    sourceMode: input.sourceMode,
    pageIntent: typeof input.pageIntent === 'string' ? input.pageIntent.trim() : '',
    styleDirection: typeof input.styleDirection === 'string' ? input.styleDirection.trim() : '',
    requiredModules,
  };
}
