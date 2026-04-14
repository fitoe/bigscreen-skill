<template>
  <PanelCard :title="title">
    <div
      ref="container"
      class="grid h-full min-h-[260px] min-w-0 gap-4"
      :class="isHorizontal ? 'grid-cols-[minmax(0,1fr)_220px] items-center' : 'grid-rows-[minmax(0,1fr)_auto]'"
    >
      <BaseChart :option="option" />
      <ul
        class="grid min-w-0 gap-3"
        :class="isHorizontal ? 'self-stretch content-center' : 'grid-cols-2 max-[720px]:grid-cols-1'"
        data-chart-legend
      >
        <li
          v-for="item in legendItems"
          :key="item.name"
          class="grid min-w-0 grid-cols-[12px_minmax(0,1fr)_auto] items-center gap-3 rounded-[14px] bg-slate-950/28 px-3 py-2.5"
        >
          <span class="h-3 w-3 rounded-full" :style="{ backgroundColor: item.color }"></span>
          <span class="truncate text-[13px] text-slate-200">{{ item.name }}</span>
          <span class="text-right text-[13px] text-slate-300/78">{{ item.valueLabel }}</span>
        </li>
      </ul>
    </div>
  </PanelCard>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

import BaseChart from './BaseChart.vue';
import PanelCard from '../PanelCard.vue';

const props = defineProps<{
  title: string;
  items: Array<{ name: string; value: number }>;
}>();

const palette = ['#53d5ff', '#2ef0c5', '#fbbf24', '#fb7185', '#818cf8', '#38bdf8'];
const container = ref<HTMLDivElement | null>(null);
const width = ref(0);
const height = ref(0);
let observer: ResizeObserver | null = null;

const total = computed(() => props.items.reduce((sum, item) => sum + item.value, 0));
const isHorizontal = computed(() => width.value >= height.value);
const legendItems = computed(() =>
  props.items.map((item, index) => ({
    ...item,
    color: palette[index % palette.length],
    valueLabel: total.value ? `${item.value} / ${Math.round((item.value / total.value) * 100)}%` : String(item.value),
  })),
);

const option = computed(() => ({
  color: legendItems.value.map((item) => item.color),
  tooltip: { trigger: 'item' },
  series: [
    {
      type: 'pie',
      radius: ['50%', '72%'],
      center: ['50%', '50%'],
      avoidLabelOverlap: true,
      data: legendItems.value.map((item) => ({
        name: item.name,
        value: item.value,
      })),
      label: { show: false },
      labelLine: { show: false },
    },
  ],
}));

function syncSize() {
  if (!container.value) return;
  width.value = container.value.clientWidth;
  height.value = container.value.clientHeight;
}

onMounted(() => {
  syncSize();
  if (container.value) {
    observer = new ResizeObserver(syncSize);
    observer.observe(container.value);
  }
});

onBeforeUnmount(() => {
  observer?.disconnect();
});
</script>
