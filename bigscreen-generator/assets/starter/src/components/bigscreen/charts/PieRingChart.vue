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
  items: Array<{ name: string; value: number }>;
}>();

const option = computed(() => ({
  tooltip: { trigger: 'item' },
  series: [
    {
      type: 'pie',
      radius: ['52%', '72%'],
      data: props.items,
      label: { color: '#eaf6ff' },
    },
  ],
}));
</script>
