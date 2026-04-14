<template>
  <div class="screen-shell">
    <slot />
  </div>
</template>

<style scoped lang="scss">
.screen-shell {
  display: grid;
  min-height: calc(100vh - 48px);
  grid-template-rows: auto auto minmax(0, 1fr) auto;
  gap: var(--space-5);
  overflow: hidden;
}
</style>
