import { createRouter, createWebHistory } from 'vue-router';
import RealEstateList from '@/components/RealEstate/RealEstateList.vue';
import RealEstateDetail from '@/components/RealEstate/RealEstateDetail.vue';
import RealEstateCompare from '@/components/RealEstate/RealEstateCompare.vue';

const routes = [
  {
    path: '/',
    name: 'RealEstateList',
    component: RealEstateList
  },
  {
    path: '/property/:id',
    name: 'RealEstateDetail',
    component: RealEstateDetail,
    props: route => ({ propertyId: Number(route.params.id) })
  },
  {
    path: '/compare',
    name: 'RealEstateCompare',
    component: RealEstateCompare
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
