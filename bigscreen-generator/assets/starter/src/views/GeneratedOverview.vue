<template>
  <BigscreenLayout>
    <ScreenShell>
      <HeaderBar :title="view.title" :subtitle="view.subtitle" :status-items="view.statusItems" />

      <section class="stats-grid">
        <StatCard
          v-for="item in view.stats"
          :key="item.label"
          :label="item.label"
          :value="item.value"
          :unit="item.unit"
          :delta="item.delta"
        />
      </section>

      <section class="hero-grid">
        <div class="side-column">
          <LineTrendChart title="Load Trend" :categories="view.trend.categories" :series="view.trend.series" />
          <RankingList title="Area Ranking" :items="view.ranking" />
        </div>

        <MapPanel title="Regional Command Map" />

        <div class="side-column">
          <BarCompareChart title="Regional Compare" :categories="view.compare.categories" :series="view.compare.series" />
          <PieRingChart title="Status Composition" :items="view.composition" />
        </div>
      </section>

      <section class="bottom-grid">
        <AlarmTicker title="Alarm Stream" :items="view.alarms" />
        <ScrollTable title="Device Status" :columns="view.table.columns" :rows="view.table.rows" />
      </section>
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

<style scoped lang="scss">
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-4);
}

.hero-grid {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr) 320px;
  gap: var(--space-5);
  align-items: stretch;
}

.side-column,
.bottom-grid {
  display: grid;
  gap: var(--space-5);
}

.bottom-grid {
  grid-template-columns: 1fr 1.4fr;
}

@media (max-width: 1280px) {
  .stats-grid,
  .hero-grid,
  .bottom-grid {
    grid-template-columns: 1fr;
  }
}
</style>
