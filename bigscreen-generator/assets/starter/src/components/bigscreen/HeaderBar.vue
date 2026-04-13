<template>
  <header class="header-bar">
    <div>
      <p class="subtitle">{{ subtitle }}</p>
      <h1>{{ title }}</h1>
    </div>
    <div class="status-list">
      <span v-for="item in statusItems" :key="item.label" class="status-item">
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

<style scoped lang="scss">
.header-bar {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-4);
}

.subtitle {
  margin: 0 0 6px;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

h1 {
  margin: 0;
  font-size: 36px;
}

.status-list {
  display: flex;
  gap: var(--space-3);
}

.status-item {
  padding: 8px 12px;
  border: 1px solid var(--panel-border);
  border-radius: 999px;
  color: var(--text-secondary);
}
</style>
