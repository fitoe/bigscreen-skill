<template>
  <article class="stat-card">
    <p class="label">{{ label }}</p>
    <div class="value-row">
      <strong>{{ value }}</strong>
      <span>{{ unit }}</span>
    </div>
    <p class="delta" :class="{ positive: delta >= 0 }">
      {{ delta >= 0 ? '+' : '' }}{{ delta }}%
    </p>
  </article>
</template>

<script setup lang="ts">
defineProps<{
  label: string;
  value: string | number;
  unit?: string;
  delta: number;
}>();
</script>

<style scoped lang="scss">
.stat-card {
  padding: var(--space-4);
  border-radius: var(--radius-md);
  background: linear-gradient(180deg, rgba(83, 213, 255, 0.12), rgba(83, 213, 255, 0.04));
}

.label,
.delta {
  margin: 0;
}

.label {
  color: var(--text-secondary);
  font-size: 14px;
}

.value-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin: 12px 0;
}

strong {
  font-size: 34px;
}

.delta {
  color: var(--danger);
  font-size: 14px;
}

.delta.positive {
  color: var(--success);
}
</style>
