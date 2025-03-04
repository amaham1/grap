import RealEstateList from '@/modules/real-estate/components/RealEstate/RealEstateList.vue';
import RealEstateDetail from '@/modules/real-estate/components/RealEstate/RealEstateDetail.vue';
import RealEstateCompare from '@/modules/real-estate/components/RealEstate/RealEstateCompare.vue';
import RealEstateLayout from '@/modules/real-estate/views/RealEstateLayout.vue';

const routes = {
  path: '/real-estate',
  component: RealEstateLayout,  // 레이아웃 컴포넌트 추가
  children: [
    {
      path: '',  // /real-estate
      name: 'RealEstateList',
      component: RealEstateList
    },
    {
      path: 'property/:id',  // /real-estate/property/:id
      name: 'RealEstateDetail',
      component: RealEstateDetail,
      props: route => ({ propertyId: Number(route.params.id) })
    },
    {
      path: 'compare',  // /real-estate/compare
      name: 'RealEstateCompare',
      component: RealEstateCompare
    }
  ]
}

export default routes;