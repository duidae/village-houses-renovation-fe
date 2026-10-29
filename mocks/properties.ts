import type { ConditionOption, ConnectivityOption, ReuseType } from '../types';

export interface PropertyMarker {
  id: string;
  name: string;
  lat: number;
  lng: number;
  description: string;
  streetViewUrl?: string;
  price: number; // 單位：萬元
  score: number; // 整建潛力分數，範圍 1~100
  county: string;
  township: string;
  village: string;
  isInKeyArea?: boolean; // 是否位在農村發展重點區
  isRuralRevitalizationCommunity?: boolean; // 是否為農村再生社區
  reuseTypes: ReuseType[]; // 建議再利用類型 (rule-based estimate)
  connectivity: ConnectivityOption[]; // 社區連結
  condition: ConditionOption | null; // 建築物狀況
}
