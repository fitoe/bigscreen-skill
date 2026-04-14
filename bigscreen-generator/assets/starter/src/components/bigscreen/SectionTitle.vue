<template>
  <div class="section-title">
    <span class="bar">
      <span class="accent"></span>
      <span>{{ title }}</span>
    </span>
  </div>
</template>

<script setup lang="ts">
defineProps<{ title: string }>();
</script>

<style scoped lang="scss">
.section-title {
  display: inline-flex;
  align-items: center;
  font-weight: 600;
}

.bar {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 34px;
  padding: 0 14px 0 12px;
  border: 1px solid var(--panel-title-border);
  border-radius: 10px 18px 10px 10px;
  background: var(--panel-title-bg);
  color: var(--text-primary);
}

.accent {
  width: 20px;
  height: 3px;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--accent-secondary), var(--accent-primary));
}
</style>
