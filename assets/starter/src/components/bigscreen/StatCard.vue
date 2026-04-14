<template>
  <article
    data-bigscreen-role="stat-card"
    class="rounded-[1rem] bg-[linear-gradient(180deg,rgba(83,213,255,0.14),rgba(83,213,255,0.04))] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] ring-1 ring-inset ring-cyan-300/10"
  >
    <p class="m-0 text-sm text-slate-300/78">{{ label }}</p>
    <div class="my-3 flex items-end gap-2">
      <strong class="text-[2rem] leading-none font-semibold text-slate-50">{{ value }}</strong>
      <span class="text-sm text-slate-300/72">{{ unit }}</span>
    </div>
    <p :class="deltaClasses">
      {{ delta >= 0 ? '+' : '' }}{{ delta }}%
    </p>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  label: string;
  value: string | number;
  unit?: string;
  delta: number;
}>();

const deltaClasses = computed(() =>
  [
    'm-0 text-sm font-medium',
    props.delta >= 0 ? 'text-emerald-300' : 'text-rose-300',
  ].join(' '),
);
</script>
