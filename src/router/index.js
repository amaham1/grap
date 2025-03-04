import { createRouter, createWebHistory } from 'vue-router'
import realEstateRoutes from '@/modules/real-estate/router'
import fuelRoutes from '@/modules/fuel/router'
import HomeView from '@/views/HomeView.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomeView
  },
  realEstateRoutes,
  fuelRoutes
]

export default createRouter({
  history: createWebHistory(),
  routes
});