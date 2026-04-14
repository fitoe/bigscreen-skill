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
  --panel-title-bg: linear-gradient(90deg, rgba(83, 213, 255, 0.16), rgba(83, 213, 255, 0.04));
  --panel-title-border: rgba(83, 213, 255, 0.28);
  --panel-corner-color: rgba(83, 213, 255, 0.42);
  --panel-inner-border: rgba(83, 213, 255, 0.12);
}

.screen-shell--tech-frame {
  --panel-title-bg: linear-gradient(90deg, rgba(83, 213, 255, 0.16), rgba(83, 213, 255, 0.04));
  --panel-title-border: rgba(83, 213, 255, 0.24);
  --panel-corner-color: rgba(83, 213, 255, 0.38);
}

.screen-shell--grid-frame {
  --panel-title-bg: linear-gradient(90deg, rgba(83, 213, 255, 0.18), rgba(46, 240, 197, 0.05));
  --panel-title-border: rgba(83, 213, 255, 0.3);
  --panel-corner-color: rgba(46, 240, 197, 0.34);
  --panel-inner-border: rgba(83, 213, 255, 0.18);
}

.screen-shell--cyan-bracket {
  --panel-title-bg: linear-gradient(90deg, rgba(46, 240, 197, 0.18), rgba(83, 213, 255, 0.06));
  --panel-title-border: rgba(46, 240, 197, 0.34);
  --panel-corner-color: rgba(46, 240, 197, 0.42);
  --panel-inner-border: rgba(46, 240, 197, 0.16);
}

.screen-shell--command-angled {
  --panel-title-bg: linear-gradient(90deg, rgba(83, 213, 255, 0.18), rgba(255, 200, 87, 0.08));
  --panel-title-border: rgba(255, 200, 87, 0.3);
  --panel-corner-color: rgba(255, 200, 87, 0.44);
  --panel-inner-border: rgba(255, 255, 255, 0.08);
}
</style>
