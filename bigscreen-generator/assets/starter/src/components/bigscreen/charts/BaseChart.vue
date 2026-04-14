<template>
  <div ref="container" class="h-full min-h-[240px]" data-bigscreen-role="chart"></div>
</template>

<script setup lang="ts">
import * as echarts from 'echarts';
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';

const props = defineProps<{
  option: echarts.EChartsOption;
}>();

const container = ref<HTMLDivElement | null>(null);
let chart: echarts.ECharts | null = null;
let observer: ResizeObserver | null = null;

function ensureChart() {
  if (!container.value) return null;
  chart ??= echarts.init(container.value);
  return chart;
}

function render() {
  const instance = ensureChart();
  if (!instance) return;
  instance.setOption(props.option, true);
  instance.resize();
}

onMounted(() => {
  render();
  if (container.value) {
    observer = new ResizeObserver(() => {
      chart?.resize();
    });
    observer.observe(container.value);
  }
});

watch(() => props.option, render, { deep: true });

onBeforeUnmount(() => {
  observer?.disconnect();
  chart?.dispose();
});
</script>
