function toWords(value) {
  return String(value ?? '')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function toPascalCase(value) {
  const words = toWords(value);
  return words.length ? words.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join('') : 'GeneratedPage';
}

function toKebabCase(value) {
  const words = toWords(value);
  return words.length ? words.map((word) => word.toLowerCase()).join('-') : 'generated-page';
}

function toSectionComponentName(semanticSlot) {
  return `${toPascalCase(semanticSlot)}Section`;
}

function toSectionId(semanticSlot, index) {
  const slug = toKebabCase(semanticSlot);
  return `${slug}-${index + 1}`;
}

export function buildBlueprint(request) {
  const requiredModules = Array.isArray(request?.requiredModules) ? request.requiredModules : [];

  return {
    pageName: toPascalCase(request?.pageIntent),
    layoutPattern: toKebabCase(request?.pageIntent),
    themeDirection: request?.styleDirection ?? '',
    sections: requiredModules.map((semanticSlot, index) => ({
      id: toSectionId(semanticSlot, index),
      semanticSlot,
      component: toSectionComponentName(semanticSlot),
      priority: 100 - index,
    })),
  };
}
