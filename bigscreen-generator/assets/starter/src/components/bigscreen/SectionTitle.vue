<template>
  <div class="section-title">
    <span class="accent"></span>
    <span>{{ title }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{ title: string }>();
</script>

<style scoped lang="scss">
.section-title {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
}

.accent {
  width: 18px;
  height: 3px;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--accent-secondary), var(--accent-primary));
}
</style>
