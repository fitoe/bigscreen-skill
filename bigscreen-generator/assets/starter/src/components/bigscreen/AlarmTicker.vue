<template>
  <PanelCard :title="title">
    <div
      class="overflow-hidden"
      :style="{ height: `calc(72px * ${visibleRows})` }"
      @mouseenter="handleEnter"
      @mouseleave="handleLeave"
    >
      <ul class="grid list-none gap-3 p-0 transition-transform duration-[450ms] ease-out" :style="listStyle">
        <li
          v-for="(item, index) in displayItems"
          :key="`${item.time}-${item.message}-${index}`"
          class="grid min-h-[60px] grid-cols-[88px_minmax(0,1fr)_auto] items-center gap-3 py-1.5"
        >
          <span class="text-sm text-slate-300/72">{{ item.time }}</span>
          <span class="min-w-0 text-[15px] text-slate-100">{{ item.message }}</span>
          <span :class="levelClass(item.level)">{{ item.level }}</span>
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

function levelClass(level: 'critical' | 'major' | 'minor') {
  return [
    'rounded-full px-2.5 py-1 text-[13px] uppercase',
    level === 'critical'
      ? 'bg-rose-400/16 text-rose-300'
      : level === 'major'
        ? 'bg-amber-300/16 text-amber-200'
        : 'bg-emerald-400/16 text-emerald-300',
  ].join(' ');
}

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
