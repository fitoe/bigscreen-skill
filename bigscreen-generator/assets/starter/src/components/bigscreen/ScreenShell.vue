<template>
  <div class="screen-shell">
    <slot />
  </div>
</template>

<style scoped lang="scss">
.screen-shell {
  display: grid;
  gap: var(--space-5);
}
</style>
