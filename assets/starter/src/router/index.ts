import { createRouter, createWebHistory } from 'vue-router';

const GeneratedOverview = () => import('@/views/GeneratedOverview.vue');

export default createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'generated-overview',
      component: GeneratedOverview,
    },
  ],
});
