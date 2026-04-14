<template>
  <PanelCard :title="title">
    <div
      class="ticker"
      :style="{ '--visible-rows': String(visibleRows) }"
      @mouseenter="handleEnter"
      @mouseleave="handleLeave"
    >
      <ul class="alarm-list" :style="listStyle">
        <li v-for="(item, index) in displayItems" :key="`${item.time}-${item.message}-${index}`">
          <span class="time">{{ item.time }}</span>
          <span class="message">{{ item.message }}</span>
          <span class="level" :class="item.level">{{ item.level }}</span>
        </li>
      </ul>
    </div>
  </PanelCard>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

import PanelCard from './PanelCard.vue';

const props = withDefaults(
  defineProps<{
    title: string;
    items: Array<{ time: string; message: string; level: 'critical' | 'major' | 'minor' }>;
    visibleCount?: number;
    interval?: number;
    pauseOnHover?: boolean;
  }>(),
  {
    visibleCount: 4,
    interval: 2600,
    pauseOnHover: true,
  },
);

const currentIndex = ref(0);
const isPaused = ref(false);
let timer: ReturnType<typeof setInterval> | null = null;

const loopEnabled = computed(() => props.items.length > props.visibleCount);
const visibleRows = computed(() => Math.max(1, Math.min(props.visibleCount, props.items.length || props.visibleCount)));
const displayItems = computed(() => (loopEnabled.value ? [...props.items, ...props.items] : props.items));
const listStyle = computed(() => ({
  transform: `translateY(-${currentIndex.value * 72}px)`,
}));

function stopTicker() {
  if (timer) clearInterval(timer);
  timer = null;
}

function startTicker() {
  stopTicker();
  if (!loopEnabled.value) return;
  timer = setInterval(() => {
    if (isPaused.value) return;
    currentIndex.value = (currentIndex.value + 1) % props.items.length;
  }, props.interval);
}

function handleEnter() {
  if (props.pauseOnHover) isPaused.value = true;
}

function handleLeave() {
  isPaused.value = false;
}

watch(
  () => [props.items, props.visibleCount, props.interval],
  () => {
    currentIndex.value = 0;
    startTicker();
  },
  { deep: true },
);

onMounted(startTicker);
onBeforeUnmount(stopTicker);
</script>

<style scoped lang="scss">
.ticker {
  height: calc(72px * var(--visible-rows));
  overflow: hidden;
}

.alarm-list {
  display: grid;
  gap: var(--space-3);
  list-style: none;
  margin: 0;
  padding: 0;
  transition: transform 0.45s ease;
}

li {
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr) auto;
  gap: var(--space-3);
  align-items: center;
  min-height: 60px;
  padding: 6px 0;
}

.time {
  color: var(--text-secondary);
  font-size: 14px;
}

.message {
  min-width: 0;
  font-size: 15px;
}

.level {
  padding: 4px 10px;
  border-radius: 999px;
  text-transform: uppercase;
  font-size: 13px;
}

.critical {
  background: rgba(255, 107, 122, 0.16);
  color: var(--danger);
}

.major {
  background: rgba(255, 200, 87, 0.16);
  color: var(--warning);
}

.minor {
  background: rgba(49, 209, 155, 0.16);
  color: var(--success);
}
</style>
