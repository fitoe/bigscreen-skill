<template>
  <PanelCard :title="title">
    <div
      class="ranking-viewport"
      :style="{ '--visible-rows': String(visibleRows) }"
      @mouseenter="handleEnter"
      @mouseleave="handleLeave"
    >
      <ol class="ranking-list" :style="listStyle">
        <li v-for="(item, index) in displayItems" :key="`${item.name}-${index}`">
          <span class="index">{{ (index % items.length) + 1 }}</span>
          <span class="name">{{ item.name }}</span>
          <strong>{{ item.value }}</strong>
        </li>
      </ol>
    </div>
  </PanelCard>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

import PanelCard from './PanelCard.vue';

const props = withDefaults(
  defineProps<{
    title: string;
    items: Array<{ name: string; value: string | number }>;
    visibleCount?: number;
    interval?: number;
    pauseOnHover?: boolean;
  }>(),
  {
    visibleCount: 5,
    interval: 2800,
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
  transform: `translateY(-${currentIndex.value * 56}px)`,
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
.ranking-viewport {
  height: calc(56px * var(--visible-rows));
  overflow: hidden;
}

.ranking-list {
  display: grid;
  gap: var(--space-3);
  margin: 0;
  padding: 0;
  list-style: none;
  transition: transform 0.45s ease;
}

li {
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr) auto;
  gap: var(--space-3);
  align-items: center;
  min-height: 44px;
  color: var(--text-secondary);
}

.index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(83, 213, 255, 0.16);
  color: var(--accent-primary);
  font-size: 13px;
}

.name {
  min-width: 0;
  font-size: 15px;
}

strong {
  color: var(--text-primary);
  font-size: 18px;
}
</style>
