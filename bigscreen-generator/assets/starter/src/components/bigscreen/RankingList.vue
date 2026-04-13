<template>
  <PanelCard :title="title">
    <ol class="ranking-list">
      <li v-for="item in items" :key="item.name">
        <span>{{ item.name }}</span>
        <strong>{{ item.value }}</strong>
      </li>
    </ol>
  </PanelCard>
</template>

<script setup lang="ts">
import PanelCard from './PanelCard.vue';

defineProps<{
  title: string;
  items: Array<{ name: string; value: string | number }>;
}>();
</script>

<style scoped lang="scss">
.ranking-list {
  display: grid;
  gap: var(--space-3);
  margin: 0;
  padding-left: 20px;
}

li {
  display: flex;
  justify-content: space-between;
  color: var(--text-secondary);
}

strong {
  color: var(--text-primary);
}
</style>
