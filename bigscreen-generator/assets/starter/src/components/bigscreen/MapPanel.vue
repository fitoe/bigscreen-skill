<template>
  <PanelCard :title="title">
    <div class="relative min-h-[360px] overflow-hidden rounded-[1rem]" data-bigscreen-role="map-panel">
      <BaseChart v-if="hasGeoJson" :option="mapOption" />
      <div
        v-else
        class="relative min-h-[360px] overflow-hidden rounded-[1rem] bg-[radial-gradient(circle_at_24%_24%,rgba(46,240,197,0.18),transparent_22%),radial-gradient(circle_at_78%_34%,rgba(83,213,255,0.22),transparent_26%),linear-gradient(180deg,rgba(10,28,50,0.92),rgba(5,14,25,0.82))]"
      >
        <div
          class="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(83,213,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(83,213,255,0.08)_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(circle_at_center,#000_42%,transparent_92%)]"
        ></div>
        <div
          v-for="(region, index) in regions"
          :key="`${region.name}-${index}`"
          class="absolute grid min-w-24 gap-1 rounded-[14px] border border-cyan-300/20 bg-slate-950/78 px-3 py-2.5 backdrop-blur"
          :style="regionStyle(index)"
        >
          <strong class="text-[15px] font-semibold text-slate-50">{{ region.name }}</strong>
          <span class="text-[13px] text-slate-300/72">{{ region.value }}</span>
        </div>
        <button
          v-for="(point, index) in points"
          :key="`${point.name}-${index}`"
          type="button"
          class="absolute -translate-x-1/2 -translate-y-1/2 border-0 bg-transparent text-slate-50"
          :style="pointStyle(point)"
        >
          <span class="mb-1.5 block h-3 w-3 rounded-full bg-teal-300 shadow-[0_0_0_6px_rgba(46,240,197,0.14)]"></span>
          <span class="whitespace-nowrap text-[13px]">{{ point.name }}</span>
        </button>
      </div>
      <div class="absolute right-4 bottom-4 grid grid-cols-2 gap-4 rounded-[14px] border border-cyan-300/20 bg-slate-950/78 px-3.5 py-3 backdrop-blur">
        <div>
          <span class="text-[13px] text-slate-300/72">Regions</span>
          <strong class="mt-1 block text-[22px] font-semibold text-slate-50">{{ regions.length }}</strong>
        </div>
        <div>
          <span class="text-[13px] text-slate-300/72">Signals</span>
          <strong class="mt-1 block text-[22px] font-semibold text-slate-50">{{ points.length }}</strong>
        </div>
      </div>
    </div>
  </PanelCard>
</template>

<script setup lang="ts">
import * as echarts from 'echarts';
import { computed, watchEffect } from 'vue';

import BaseChart from './charts/BaseChart.vue';
import PanelCard from './PanelCard.vue';

type RegionItem = { name: string; value: string | number };
type PointItem = { name: string; x: number; y: number };
type GeoJsonLike = Record<string, unknown>;

const props = withDefaults(
  defineProps<{
    title: string;
    regions?: RegionItem[];
    points?: PointItem[];
    geoJson?: GeoJsonLike | null;
    mapMeta?: { adcode?: string; level?: string; name?: string } | null;
  }>(),
  {
    regions: () => [],
    points: () => [],
    geoJson: null,
    mapMeta: null,
  },
);

const hasGeoJson = computed(() => Boolean(props.geoJson));
const mapName = computed(() => `bigscreen-map-${props.mapMeta?.adcode || props.mapMeta?.name || props.title}`.replace(/[^\w-]/g, '-'));

watchEffect(() => {
  if (props.geoJson) {
    echarts.registerMap(mapName.value, props.geoJson as never);
  }
});

function toNumericValue(value: string | number) {
  if (typeof value === 'number') return value;
  const match = String(value).match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

const mapOption = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: { trigger: 'item' },
  geo: {
    map: mapName.value,
    roam: false,
    zoom: 1,
    itemStyle: {
      areaColor: '#10325b',
      borderColor: '#53d5ff',
      borderWidth: 1,
    },
    emphasis: {
      itemStyle: {
        areaColor: '#1d568c',
      },
      label: {
        color: '#f8fbff',
      },
    },
    label: {
      show: true,
      color: '#cce7ff',
      fontSize: 11,
    },
  },
  series: [
    {
      type: 'map',
      map: mapName.value,
      geoIndex: 0,
      data: props.regions.map((region) => ({
        name: region.name,
        value: toNumericValue(region.value),
      })),
    },
  ],
 }));

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
