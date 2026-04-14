<template>
  <PanelCard :title="title">
    <div
      class="grid h-full min-h-[360px] min-w-0 gap-4"
      :class="regions.length ? 'grid-cols-[minmax(0,220px)_minmax(0,1fr)]' : 'grid-cols-1'"
    >
      <div v-if="regions.length" class="grid auto-rows-[minmax(0,1fr)] gap-3">
        <article
          v-for="(region, index) in regions"
          :key="`${region.name}-${index}`"
          class="grid content-center gap-1 rounded-[14px] bg-slate-950/36 px-4 py-3 ring-1 ring-inset ring-cyan-300/12"
        >
          <strong class="text-[15px] font-semibold text-slate-50">{{ region.name }}</strong>
          <span class="text-[13px] text-slate-300/78">{{ region.value }}</span>
        </article>
      </div>

      <div class="relative flex min-h-[360px] min-w-0 items-center justify-center overflow-hidden rounded-[1rem]" data-bigscreen-role="map-panel">
        <BaseChart v-if="hasGeoJson" :option="mapOption" />
        <div
          v-else
          class="relative flex h-full w-full items-center justify-center overflow-hidden rounded-[1rem] bg-[radial-gradient(circle_at_50%_50%,rgba(46,240,197,0.16),transparent_24%),radial-gradient(circle_at_50%_50%,rgba(83,213,255,0.18),transparent_60%),linear-gradient(180deg,rgba(10,28,50,0.92),rgba(5,14,25,0.82))]"
        >
          <div
            class="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(83,213,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(83,213,255,0.08)_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(circle_at_center,#000_42%,transparent_92%)]"
          ></div>
          <div class="pointer-events-none absolute h-[68%] w-[68%] rounded-[44%_56%_52%_48%/48%_44%_56%_52%] border border-cyan-300/28 bg-cyan-300/8 shadow-[0_0_80px_rgba(83,213,255,0.12)]"></div>
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
    layoutCenter: ['50%', '50%'],
    layoutSize: '88%',
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
      color: '#f5fbff',
      fontSize: 11,
      textBorderColor: 'rgba(5,14,25,0.92)',
      textBorderWidth: 3,
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
</script>
