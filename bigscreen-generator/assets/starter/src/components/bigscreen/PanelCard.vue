<template>
  <section :class="shellClasses">
    <span :class="['absolute left-2 top-2 h-[18px] w-[18px] border-l-2 border-t-2', cornerClasses]"></span>
    <span :class="['absolute right-2 top-2 h-[18px] w-[18px] border-r-2 border-t-2', cornerClasses]"></span>
    <span :class="['absolute bottom-2 left-2 h-[18px] w-[18px] border-b-2 border-l-2', cornerClasses]"></span>
    <span :class="['absolute bottom-2 right-2 h-[18px] w-[18px] border-b-2 border-r-2', cornerClasses]"></span>
    <SectionTitle v-if="title" :title="title" />
    <div class="mt-4 min-h-0">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue';

import { panelBaseClass, panelChromeKey, panelCornerClasses, panelVariantClasses, resolveChromeVariant } from '@/theme/chrome';
import SectionTitle from './SectionTitle.vue';

defineProps<{ title?: string }>();
const chromeVariantRef = inject(panelChromeKey, computed(() => resolveChromeVariant()));

const shellClasses = computed(() => [panelBaseClass, panelVariantClasses[chromeVariantRef.value]].join(' '));
const cornerClasses = computed(() => panelCornerClasses[chromeVariantRef.value]);
</script>
