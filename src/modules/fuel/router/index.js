import Fuel from '@/modules/fuel/Fuel.vue';
import FuelList from '@/modules/components/fuel/FuelList.vue';

const fuelRoutes = {
  path: '/fuel',
  component: Fuel,  // 레이아웃 컴포넌트
  children: [
    {
      path: '',
      name: 'FuelList',
      component: FuelList
    },
  ]
}

export default fuelRoutes;