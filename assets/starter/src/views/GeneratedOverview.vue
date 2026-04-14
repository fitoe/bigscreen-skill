<template>
  <BigscreenLayout>
    <ScreenShell variant="tech-frame">
      <HeaderBar :title="view.title" :subtitle="view.subtitle" :status-items="view.statusItems" />

      <div class="grid min-h-0 flex-1 gap-5 [grid-template-rows:auto_minmax(0,1fr)_auto]">
        <section class="grid gap-4 xl:grid-cols-4">
          <StatCard
            v-for="item in view.stats"
            :key="item.label"
            :label="item.label"
            :value="item.value"
            :unit="item.unit"
            :delta="item.delta"
          />
        </section>

        <section class="grid min-h-0 items-stretch gap-5 xl:grid-cols-[320px_minmax(0,1fr)_320px]">
          <div class="grid auto-rows-[minmax(0,1fr)] gap-5">
            <LineTrendChart title="Load Trend" :categories="view.trend.categories" :series="view.trend.series" />
            <RankingList title="Area Ranking" :items="view.ranking" />
          </div>

          <MapPanel title="Regional Command Map" :regions="view.mapRegions" :points="view.mapPoints" :geo-json="view.mapGeoJson" :map-meta="view.mapMeta" />

          <div class="grid auto-rows-[minmax(0,1fr)] gap-5">
            <BarCompareChart title="Regional Compare" :categories="view.compare.categories" :series="view.compare.series" />
            <PieRingChart title="Status Composition" :items="view.composition" />
          </div>
        </section>

        <section class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <AlarmTicker title="Alarm Stream" :items="view.alarms" />
          <ScrollTable title="Device Status" :columns="view.table.columns" :rows="view.table.rows" />
        </section>
      </div>
    </ScreenShell>
  </BigscreenLayout>
</template>

<script setup lang="ts">
import AlarmTicker from '@/components/bigscreen/AlarmTicker.vue';
import HeaderBar from '@/components/bigscreen/HeaderBar.vue';
import MapPanel from '@/components/bigscreen/MapPanel.vue';
import RankingList from '@/components/bigscreen/RankingList.vue';
import ScreenShell from '@/components/bigscreen/ScreenShell.vue';
import ScrollTable from '@/components/bigscreen/ScrollTable.vue';
import StatCard from '@/components/bigscreen/StatCard.vue';
import BarCompareChart from '@/components/bigscreen/charts/BarCompareChart.vue';
import LineTrendChart from '@/components/bigscreen/charts/LineTrendChart.vue';
import PieRingChart from '@/components/bigscreen/charts/PieRingChart.vue';
import BigscreenLayout from '@/layouts/BigscreenLayout.vue';
import { useGeneratedOverview } from '@/composables/useGeneratedOverview';

const view = useGeneratedOverview();
</script>
