<template>
  <header class="flex items-end justify-between gap-4">
    <div>
      <p class="mb-1.5 text-xs uppercase tracking-[0.28em] text-slate-300/72">{{ subtitle }}</p>
      <h1 class="m-0 text-[clamp(2rem,3vw,2.75rem)] font-semibold tracking-[0.04em] text-slate-50">{{ title }}</h1>
    </div>
    <div class="flex flex-wrap gap-3">
      <span
        v-for="item in statusItems"
        :key="item.label"
        class="rounded-full border border-cyan-300/18 bg-slate-950/28 px-3 py-2 text-sm text-slate-300/85 backdrop-blur"
      >
        {{ item.label }} {{ item.value }}
      </span>
    </div>
  </header>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  subtitle?: string;
  statusItems?: Array<{ label: string; value: string }>;
}>();
</script>
