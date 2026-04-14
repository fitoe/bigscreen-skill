<template>
  <PanelCard :title="title">
    <div
      ref="viewport"
      data-bigscreen-role="ranking-list"
      class="min-h-0 overflow-hidden"
      @mouseenter="handleEnter"
      @mouseleave="handleLeave"
    >
      <ol class="grid list-none gap-3 p-0 transition-transform duration-[450ms] ease-out" :style="listStyle">
        <li
          v-for="(item, index) in displayItems"
          :key="`${item.name}-${index}`"
          class="grid min-h-11 grid-cols-[32px_minmax(0,1fr)_auto] items-center gap-3 text-slate-300/78"
        >
          <span class="inline-flex h-7 w-7 items-center justify-center rounded-full bg-cyan-300/16 text-[13px] text-cyan-300">
            {{ (index % items.length) + 1 }}
          </span>
          <span class="min-w-0 text-[15px] text-slate-100">{{ item.name }}</span>
          <strong class="text-lg font-semibold text-slate-50">{{ item.value }}</strong>
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

const rowHeight = 56;
const currentIndex = ref(0);
const isPaused = ref(false);
const viewport = ref<HTMLDivElement | null>(null);
const viewportHeight = ref(0);
let timer: ReturnType<typeof setInterval> | null = null;
let observer: ResizeObserver | null = null;

const visibleCapacity = computed(() => {
  const measured = Math.floor(viewportHeight.value / rowHeight);
  return Math.max(1, measured || props.visibleCount);
});
const shouldScroll = computed(() => props.items.length > visibleCapacity.value);
const displayItems = computed(() => (shouldScroll.value ? [...props.items, ...props.items] : props.items));
const listStyle = computed(() => ({
  transform: `translateY(-${currentIndex.value * rowHeight}px)`,
}));

function syncViewportHeight() {
  viewportHeight.value = viewport.value?.clientHeight || 0;
}

function stopTicker() {
  if (timer) clearInterval(timer);
  timer = null;
}

function startTicker() {
  stopTicker();
  if (!shouldScroll.value) return;
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
  () => [props.items, props.visibleCount, props.interval, visibleCapacity.value],
  () => {
    currentIndex.value = 0;
    startTicker();
  },
  { deep: true },
);

onMounted(() => {
  syncViewportHeight();
  if (viewport.value) {
    observer = new ResizeObserver(syncViewportHeight);
    observer.observe(viewport.value);
  }
  startTicker();
});

onBeforeUnmount(() => {
  observer?.disconnect();
  stopTicker();
});
</script>
