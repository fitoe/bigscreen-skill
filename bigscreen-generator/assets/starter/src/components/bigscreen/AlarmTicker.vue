<template>
  <PanelCard :title="title">
    <ul class="alarm-list">
      <li v-for="item in items" :key="`${item.time}-${item.message}`">
        <span class="time">{{ item.time }}</span>
        <span class="message">{{ item.message }}</span>
        <span class="level" :class="item.level">{{ item.level }}</span>
      </li>
    </ul>
  </PanelCard>
</template>

<script setup lang="ts">
import PanelCard from './PanelCard.vue';

defineProps<{
  title: string;
  items: Array<{ time: string; message: string; level: 'critical' | 'major' | 'minor' }>;
}>();
</script>

<style scoped lang="scss">
.alarm-list {
  display: grid;
  gap: var(--space-3);
  list-style: none;
  margin: 0;
  padding: 0;
}

li {
  display: grid;
  grid-template-columns: 96px 1fr auto;
  gap: var(--space-3);
  align-items: center;
}

.time {
  color: var(--text-secondary);
}

.level {
  padding: 4px 10px;
  border-radius: 999px;
  text-transform: uppercase;
}

.critical {
  background: rgba(255, 107, 122, 0.16);
  color: var(--danger);
}

.major {
  background: rgba(255, 200, 87, 0.16);
  color: var(--warning);
}

.minor {
  background: rgba(49, 209, 155, 0.16);
  color: var(--success);
}
</style>
