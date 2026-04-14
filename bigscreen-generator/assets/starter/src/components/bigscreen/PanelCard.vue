<template>
  <section class="panel-card">
    <span class="corner corner--tl"></span>
    <span class="corner corner--tr"></span>
    <span class="corner corner--bl"></span>
    <span class="corner corner--br"></span>
    <SectionTitle v-if="title" :title="title" />
    <div class="body">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
import SectionTitle from './SectionTitle.vue';

defineProps<{ title?: string }>();
</script>

<style scoped lang="scss">
.panel-card {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  border: 1px solid var(--panel-border);
  border-radius: var(--radius-lg);
  background: var(--panel-bg);
  box-shadow: var(--panel-shadow);
  padding: var(--space-5);
  min-height: 0;
  overflow: hidden;
  position: relative;
}

.panel-card::before {
  content: '';
  position: absolute;
  inset: 8px;
  border: 1px solid var(--panel-inner-border);
  border-radius: calc(var(--radius-lg) - 6px);
  pointer-events: none;
}

.body {
  margin-top: var(--space-4);
  min-height: 0;
}

.corner {
  position: absolute;
  width: 18px;
  height: 18px;
  border-color: var(--panel-corner-color);
  border-style: solid;
  pointer-events: none;
}

.corner--tl {
  top: 8px;
  left: 8px;
  border-width: 2px 0 0 2px;
}

.corner--tr {
  top: 8px;
  right: 8px;
  border-width: 2px 2px 0 0;
}

.corner--bl {
  bottom: 8px;
  left: 8px;
  border-width: 0 0 2px 2px;
}

.corner--br {
  right: 8px;
  bottom: 8px;
  border-width: 0 2px 2px 0;
}
</style>
