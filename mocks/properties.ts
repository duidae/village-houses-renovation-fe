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
