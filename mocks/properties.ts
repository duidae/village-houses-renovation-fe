export interface PropertyMarker {
  id: string;
  name: string;
  lat: number;
  lng: number;
  description: string;
  streetViewUrl?: string;
  renovationStatus: 'planning' | 'in-progress' | 'completed';
  price: number; // 單位：萬元
  score: number; // 整建潛力分數，範圍 1~100
}

export const sampleProperties: PropertyMarker[] = [
  {
    id: 'prop-1',
    name: '嘉義好宅1 - 文化傳承宅',
    lat: 23.4789,
    lng: 120.4470,
    description: '木造老屋，保留傳統建築特色，規劃文化展示空間',
    renovationStatus: 'planning',
    price: 680,
    score: 72,
  },
  {
    id: 'prop-2',
    name: '嘉義好宅2 - 生態永續宅',
    lat: 23.4799,
    lng: 120.4480,
    description: '導入生態理念，設置太陽能、雨水回收系統',
    renovationStatus: 'in-progress',
    price: 920,
    score: 85,
  },
  {
    id: 'prop-3',
    name: '嘉義好宅3 - 樂齡友善宅',
    lat: 23.4809,
    lng: 120.4490,
    description: '無障礙空間改造，適合銀髮族居住',
    renovationStatus: 'completed',
    price: 1250,
    score: 91,
  },
  {
    id: 'prop-4',
    name: '嘉義好宅4 - 青創基地宅',
    lat: 23.4779,
    lng: 120.4460,
    description: '改造為青年創業空間，結合居住與工作功能',
    renovationStatus: 'planning',
    price: 450,
    score: 58,
  },
];
