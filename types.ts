

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

export interface ForceItem {
  score: number;
  analysis: string;
}

export interface FiveForcesAnalysis {
  industryRivalry: ForceItem;
  threatOfNewEntrants: ForceItem;
  bargainingPowerOfBuyers: ForceItem;
  bargainingPowerOfSuppliers: ForceItem;
  threatOfSubstituteProducts: ForceItem;
}


export interface AnalysisData {
  basicInfo: BasicInfo;
  environmentalAnalysis: EnvironmentalAnalysis;
  potentialIndex: PotentialIndex;
  cityPopulation: PopulationDataPoint[];
  populationStructure?: PopulationStructure | null;
  schoolEnrollment: SchoolEnrollmentDataPoint[];
  fiveForcesAnalysis: FiveForcesAnalysis;
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