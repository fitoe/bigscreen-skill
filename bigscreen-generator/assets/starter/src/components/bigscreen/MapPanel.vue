<template>
  <PanelCard :title="title">
    <div class="map-panel">
      <div class="grid"></div>
      <div v-for="(region, index) in regions" :key="`${region.name}-${index}`" class="region-tag" :style="regionStyle(index)">
        <strong>{{ region.name }}</strong>
        <span>{{ region.value }}</span>
      </div>
      <button
        v-for="(point, index) in points"
        :key="`${point.name}-${index}`"
        type="button"
        class="map-point"
        :style="pointStyle(point)"
      >
        <span class="pulse"></span>
        <span class="text">{{ point.name }}</span>
      </button>
      <div class="summary">
        <div>
          <span class="summary-label">Regions</span>
          <strong>{{ regions.length }}</strong>
        </div>
        <div>
          <span class="summary-label">Signals</span>
          <strong>{{ points.length }}</strong>
        </div>
      </div>
    </div>
  </PanelCard>
</template>

<script setup lang="ts">
import PanelCard from './PanelCard.vue';

type RegionItem = { name: string; value: string | number };
type PointItem = { name: string; x: number; y: number };

const props = withDefaults(
  defineProps<{
    title: string;
    regions?: RegionItem[];
    points?: PointItem[];
  }>(),
  {
    regions: () => [],
    points: () => [],
  },
);

function pointStyle(point: PointItem) {
  return {
    left: `${point.x}%`,
    top: `${point.y}%`,
  };
}

function regionStyle(index: number) {
  const positions = [
    { left: '14%', top: '18%' },
    { left: '58%', top: '22%' },
    { left: '22%', top: '58%' },
    { left: '60%', top: '62%' },
  ];
  return positions[index % positions.length];
}
</script>

<style scoped lang="scss">
.map-panel {
  position: relative;
  min-height: 360px;
  overflow: hidden;
  border-radius: var(--radius-md);
  background:
    radial-gradient(circle at 24% 24%, rgba(46, 240, 197, 0.18), transparent 22%),
    radial-gradient(circle at 78% 34%, rgba(83, 213, 255, 0.22), transparent 26%),
    linear-gradient(180deg, rgba(10, 28, 50, 0.92), rgba(5, 14, 25, 0.82));
}

.grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(83, 213, 255, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(83, 213, 255, 0.08) 1px, transparent 1px);
  background-size: 24px 24px;
  mask-image: radial-gradient(circle at center, #000 42%, transparent 92%);
}

.region-tag,
.summary {
  position: absolute;
  border: 1px solid rgba(83, 213, 255, 0.2);
  border-radius: 14px;
  background: rgba(6, 16, 28, 0.78);
  backdrop-filter: blur(10px);
}

.region-tag {
  display: grid;
  gap: 4px;
  min-width: 96px;
  padding: 10px 12px;
}

.region-tag strong {
  font-size: 15px;
}

.region-tag span,
.summary-label {
  color: var(--text-secondary);
  font-size: 13px;
}

.map-point {
  position: absolute;
  transform: translate(-50%, -50%);
  border: 0;
  background: transparent;
  color: var(--text-primary);
  cursor: default;
}

.pulse {
  display: block;
  width: 12px;
  height: 12px;
  margin: 0 auto 6px;
  border-radius: 50%;
  background: var(--accent-secondary);
  box-shadow: 0 0 0 6px rgba(46, 240, 197, 0.14);
}

.text {
  font-size: 13px;
  white-space: nowrap;
}

.summary {
  right: 16px;
  bottom: 16px;
  display: grid;
  grid-template-columns: repeat(2, minmax(72px, 1fr));
  gap: 16px;
  padding: 12px 14px;
}

.summary strong {
  display: block;
  margin-top: 4px;
  font-size: 22px;
}
</style>
