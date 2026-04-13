<template>
  <PanelCard :title="title">
    <BaseChart :option="option" />
  </PanelCard>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import BaseChart from './BaseChart.vue';
import PanelCard from '../PanelCard.vue';

const props = defineProps<{
  title: string;
  categories: string[];
  series: number[];
}>();

const option = computed(() => ({
  xAxis: {
    type: 'category',
    data: props.categories,
    axisLabel: { color: '#91b9dc' },
  },
  yAxis: {
    type: 'value',
    axisLabel: { color: '#91b9dc' },
  },
  series: [
    {
      data: props.series,
      type: 'bar',
      itemStyle: {
        color: '#2ef0c5',
        borderRadius: [8, 8, 0, 0],
      },
    },
  ],
  grid: { left: 24, right: 16, top: 20, bottom: 24 },
  tooltip: { trigger: 'axis' },
}));
</script>
