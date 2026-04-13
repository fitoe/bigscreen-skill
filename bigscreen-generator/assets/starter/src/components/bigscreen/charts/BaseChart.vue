<template>
  <div ref="container" class="chart"></div>
</template>

<script setup lang="ts">
import * as echarts from 'echarts';
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';

const props = defineProps<{
  option: echarts.EChartsOption;
}>();

const container = ref<HTMLDivElement | null>(null);
let chart: echarts.ECharts | null = null;

function render() {
  if (!container.value) return;
  chart ??= echarts.init(container.value);
  chart.setOption(props.option);
}

onMounted(() => {
  render();
  window.addEventListener('resize', render);
});

watch(() => props.option, render, { deep: true });

onBeforeUnmount(() => {
  window.removeEventListener('resize', render);
  chart?.dispose();
});
</script>

<style scoped lang="scss">
.chart {
  min-height: 240px;
}
</style>
