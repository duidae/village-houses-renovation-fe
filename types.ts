

export interface BasicInfo {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  buildingType: string;
  floorCount: number | null;
  isHeritage: boolean;
  isRuralRevitalizationCommunity: boolean;
  communityOrgStatus: string;
  // 代表性地段地號 (E.宅院土地資料)
  landSection?: string; // 地段
  landNumber?: string; // 地號
  landArea?: string; // 土地面積
  landUseZone?: string; // 土地使用分區
  landUseSurveyCategory?: string; // 國土利用調查類別
}

export interface EnvironmentalAnalysis {
  localAttractions: string[];
  localSpecialtyFoods: string[];
}

export interface PotentialIndex {
  cpiScore: number;
}

export interface PopulationDataPoint {
  year: number;
  population: number;
  households?: number;
}

export interface PopulationStructure {
  male: number;
  female: number;
  youth: number; // 幼年人口 0-14
  workingAge: number; // 壯年人口 15-64
  elderly: number; // 老年人口 65+
}

export interface SchoolEnrollmentDataPoint {
  year: number;
  studentCount: number;
}

// --- New Strategic Analysis Framework ---

export interface AspectItem {
  score: number; // 0-10, higher is better
  analysis: string; // **keyword** marks highlighted text
}

// 宅院面向分析
export interface AspectAnalysis {
  communityConnection: AspectItem; // 社區連結
  buildingCondition: AspectItem; // 建築物狀況
  historicalValue: AspectItem; // 歷史價值
  courtyardLayout: AspectItem; // 院落配置
}


export interface AnalysisData {
  basicInfo: BasicInfo;
  environmentalAnalysis: EnvironmentalAnalysis;
  potentialIndex: PotentialIndex;
  cityPopulation: PopulationDataPoint[];
  populationStructure?: PopulationStructure | null;
  schoolEnrollment: SchoolEnrollmentDataPoint[];
  aspectAnalysis: AspectAnalysis;
  reuseTypes: ReuseType[]; // 再利用類型建議, same values as the 再利用類型方向 filter
}

// --- Search Filters ---

export const REUSE_TYPES = [
  '照顧療育服務型',
  '社區生活共享型',
  '文化保存展示型',
  '地方技藝培育型',
  '食農教育體驗型',
  '產業加工營運型',
  '青年創業共創型',
  '農遊體驗服務型',
  '社區安全韌性型',
  '兒少/數位共學服務型',
  '社區健康促進型',
] as const;

export type ReuseType = (typeof REUSE_TYPES)[number];
export type ReuseFilter = '全部' | ReuseType;

export const POTENTIAL_LEVELS = ['高', '中', '低'] as const;
export type PotentialLevel = (typeof POTENTIAL_LEVELS)[number];

export const CONNECTIVITY_OPTIONS = [
  '地點佳，主幹道上',
  '有公共設施，方圓半徑300公尺內有迎毗設施',
  '交通佳，至最近公共運輸站點的直線距離<=300m',
] as const;
export type ConnectivityOption = (typeof CONNECTIVITY_OPTIONS)[number];

export const CONDITION_OPTIONS = ['結構狀態良好', '維護狀態良好'] as const;
export type ConditionOption = (typeof CONDITION_OPTIONS)[number];

// Every filter is single-select and independent; a house must satisfy all of
// them at once. '全部' means the filter is not applied.
export interface HouseFilters {
  area: string; // researchAreaLabel (縣市+鄉鎮+村里)
  houseId: string;
  potential: '全部' | PotentialLevel;
  reuse: ReuseFilter;
  connectivity: '全部' | ConnectivityOption;
  condition: '全部' | ConditionOption;
}

// --- Caching and History ---

export interface CacheEntry {
  data: AnalysisData;
  timestamp: number;
}

export interface SearchHistoryItem {
  schoolName: string;
  date: string;
}