<template>
  <PanelCard :title="title">
    <table class="table">
      <thead>
        <tr>
          <th v-for="column in columns" :key="column.key">{{ column.label }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.id">
          <td v-for="column in columns" :key="column.key">{{ row[column.key] }}</td>
        </tr>
      </tbody>
    </table>
  </PanelCard>
</template>

<script setup lang="ts">
import PanelCard from './PanelCard.vue';

defineProps<{
  title: string;
  columns: Array<{ key: string; label: string }>;
  rows: Array<Record<string, string | number>>;
}>();
</script>

<style scoped lang="scss">
.table {
  width: 100%;
  border-collapse: collapse;
  color: var(--text-secondary);
}

th,
td {
  padding: 12px 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  text-align: left;
}
</style>
