<template>
  <div class="inline-flex items-center font-semibold">
    <span :class="titleClasses">
      <span :class="accentClasses"></span>
      <span>{{ title }}</span>
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue';

import { panelChromeKey, resolveChromeVariant, titleAccentClasses, titleBaseClass, titleVariantClasses } from '@/theme/chrome';

defineProps<{ title: string }>();
const chromeVariantRef = inject(panelChromeKey, computed(() => resolveChromeVariant()));

const titleClasses = computed(() => [titleBaseClass, titleVariantClasses[chromeVariantRef.value]].join(' '));
const accentClasses = computed(() => [
  'h-[3px] w-5 rounded-full',
  titleAccentClasses[chromeVariantRef.value],
].join(' '));
</script>
