const DEFAULT_BUILD_POLICIES = {
  install: true,
  typecheck: true,
  build: true,
};

function mergePolicyObject(base, override) {
  return {
    ...(base && typeof base === 'object' ? base : {}),
    ...(override && typeof override === 'object' ? override : {}),
  };
}

export function applyManifestPolicies(manifest = {}) {
  return {
    ...manifest,
    buildPolicies: mergePolicyObject(manifest.buildPolicies, DEFAULT_BUILD_POLICIES),
  };
}
