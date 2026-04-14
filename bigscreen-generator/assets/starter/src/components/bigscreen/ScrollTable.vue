<template>
  <PanelCard :title="title">
    <div class="table-shell">
      <div class="table-head" :style="gridStyle">
        <span v-for="column in normalizedColumns" :key="column.key">{{ column.label }}</span>
      </div>

      <div
        class="body-viewport"
        :style="{ '--visible-rows': String(visibleRows) }"
        @mouseenter="handleEnter"
        @mouseleave="handleLeave"
      >
        <div class="table-body" :style="[gridStyle, bodyStyle]">
          <template v-for="(row, rowIndex) in displayRows" :key="rowKey(row, rowIndex)">
            <span v-for="column in normalizedColumns" :key="`${rowKey(row, rowIndex)}-${column.key}`">
              {{ row[column.key] ?? '-' }}
            </span>
          </template>
        </div>
      </div>
    </div>
  </PanelCard>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

import PanelCard from './PanelCard.vue';

type TableRow = Record<string, string | number>;
type TableColumn = { key: string; label: string; width?: string };

const props = withDefaults(
  defineProps<{
    title: string;
    columns: TableColumn[];
    rows: TableRow[];
    visibleCount?: number;
    interval?: number;
    pauseOnHover?: boolean;
  }>(),
  {
    visibleCount: 5,
    interval: 2600,
    pauseOnHover: true,
  },
);

const currentIndex = ref(0);
const isPaused = ref(false);
let timer: ReturnType<typeof setInterval> | null = null;

function inferWidth(column: TableColumn) {
  if (column.width) return column.width;
  if (/name|title|region|device|message/i.test(column.key)) return '1.8fr';
  if (/status|level|type/i.test(column.key)) return '1fr';
  if (/value|count|rate|load|score/i.test(column.key)) return '0.9fr';
  return '1.1fr';
}

const normalizedColumns = computed(() =>
  props.columns.map((column) => ({
    ...column,
    width: inferWidth(column),
  })),
);
const loopEnabled = computed(() => props.rows.length > props.visibleCount);
const visibleRows = computed(() => Math.max(1, Math.min(props.visibleCount, props.rows.length || props.visibleCount)));
const displayRows = computed(() => (loopEnabled.value ? [...props.rows, ...props.rows] : props.rows));
const gridStyle = computed(() => ({
  gridTemplateColumns: normalizedColumns.value.map((column) => column.width).join(' '),
}));
const bodyStyle = computed(() => ({
  transform: `translateY(-${currentIndex.value * 48}px)`,
}));

function rowKey(row: TableRow, index: number) {
  return String(row.id ?? row.name ?? index);
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
    currentIndex.value = (currentIndex.value + 1) % props.rows.length;
  }, props.interval);
}

function handleEnter() {
  if (props.pauseOnHover) isPaused.value = true;
}

function handleLeave() {
  isPaused.value = false;
}

watch(
  () => [props.rows, props.columns, props.visibleCount, props.interval],
  () => {
    currentIndex.value = 0;
    startTicker();
  },
  { deep: true },
);

onMounted(startTicker);
onBeforeUnmount(stopTicker);
</script>

<style scoped lang="scss">
.table-shell {
  display: grid;
  gap: var(--space-3);
}

.table-head,
.table-body {
  display: grid;
  gap: 0;
  align-items: center;
}

.table-head {
  padding-right: 8px;
  color: var(--text-primary);
  font-size: 15px;
}

.table-head > span,
.table-body > span {
  min-width: 0;
  padding: 12px 10px;
}

.body-viewport {
  height: calc(48px * var(--visible-rows));
  overflow: hidden;
  position: relative;
  scrollbar-width: none;
}

.body-viewport::-webkit-scrollbar {
  display: none;
}

.table-body {
  color: var(--text-secondary);
  font-size: 14px;
  transition: transform 0.45s ease;
}

.table-body > span {
  min-height: 48px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}
</style>
