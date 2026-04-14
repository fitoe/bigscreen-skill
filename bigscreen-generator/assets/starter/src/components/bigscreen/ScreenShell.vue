<template>
  <div :class="shellClasses" :data-panel-chrome="chromeVariant" data-bigscreen-role="screen-shell">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed, provide } from 'vue';

import { panelChromeKey, resolveChromeVariant, shellBaseClass, shellVariantClasses } from '@/theme/chrome';

const props = withDefaults(
  defineProps<{
    variant?: string;
  }>(),
  {
    variant: 'tech-frame',
  },
);

const chromeVariant = computed(() => resolveChromeVariant(props.variant));
provide(panelChromeKey, chromeVariant);

const shellClasses = computed(() => [shellBaseClass, shellVariantClasses[chromeVariant.value]].join(' '));
</script>
