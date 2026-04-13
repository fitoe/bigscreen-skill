<template>
  <PanelCard :title="title">
    <div class="map-placeholder">
      <div class="grid"></div>
      <div class="label">Map panel placeholder</div>
    </div>
  </PanelCard>
</template>

<script setup lang="ts">
import PanelCard from './PanelCard.vue';

defineProps<{ title: string }>();
</script>

<style scoped lang="scss">
.map-placeholder {
  position: relative;
  min-height: 360px;
  overflow: hidden;
  border-radius: var(--radius-md);
  background: radial-gradient(circle at center, rgba(46, 240, 197, 0.18), rgba(7, 17, 31, 0.3));
}

.grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(83, 213, 255, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(83, 213, 255, 0.08) 1px, transparent 1px);
  background-size: 24px 24px;
}

.label {
  position: absolute;
  left: 24px;
  bottom: 20px;
  color: var(--text-secondary);
}
</style>
