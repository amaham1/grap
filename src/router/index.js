import { createRouter, createWebHistory } from 'vue-router';
import RealEstateList from '@/components/RealEstate/RealEstateList.vue';
import RealEstateDetail from '@/components/RealEstate/RealEstateDetail.vue';

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
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.afterEach(() => {
  if (window.adsbygoogle) {
    (window.adsbygoogle).push({});
  }
});

export default router;
