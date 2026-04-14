<template>
  <section class="panel-card">
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
}

.body {
  margin-top: var(--space-4);
  min-height: 0;
}
</style>
