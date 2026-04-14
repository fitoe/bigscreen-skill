<template>
  <PanelCard :title="title">
    <div class="grid gap-3">
      <div class="grid items-center pr-2 text-[15px] text-slate-100" :style="gridStyle">
        <span v-for="column in normalizedColumns" :key="column.key" class="min-w-0 px-2.5 py-3">{{ column.label }}</span>
      </div>

      <div
        class="overflow-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        :style="{ height: `calc(48px * ${visibleRows})` }"
        @mouseenter="handleEnter"
        @mouseleave="handleLeave"
      >
        <div class="grid items-center text-sm text-slate-300/78 transition-transform duration-[450ms] ease-out" :style="[gridStyle, bodyStyle]">
          <template v-for="(row, rowIndex) in displayRows" :key="rowKey(row, rowIndex)">
            <span
              v-for="column in normalizedColumns"
              :key="`${rowKey(row, rowIndex)}-${column.key}`"
              class="min-w-0 border-b border-white/6 px-2.5 py-3 leading-6"
            >
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
