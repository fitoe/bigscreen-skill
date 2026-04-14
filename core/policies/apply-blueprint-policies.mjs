const DEFAULT_SECTION_POLICIES = {
  'composition-chart': {
    legendMode: 'data-bound',
  },
  'data-table': {
    minVisibleRows: 5,
  },
  'geo-focus': {
    centerMap: true,
  },
};

function mergePolicyObject(base, override) {
  return {
    ...(base && typeof base === 'object' ? base : {}),
    ...(override && typeof override === 'object' ? override : {}),
  };
}

export function applyBlueprintPolicies(blueprint = {}) {
  const sectionPolicies = mergePolicyObject({}, blueprint.sectionPolicies);

  for (const [semanticSlot, defaultPolicy] of Object.entries(DEFAULT_SECTION_POLICIES)) {
    sectionPolicies[semanticSlot] = mergePolicyObject(defaultPolicy, sectionPolicies[semanticSlot]);
  }

  return {
    ...blueprint,
    pagePolicy: mergePolicyObject(blueprint.pagePolicy, {
      noPageScroll: true,
      viewportLocked: true,
    }),
    sectionPolicies,
  };
}
