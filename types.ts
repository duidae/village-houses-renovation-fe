

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

export type ReuseFilter = '全部' | (typeof REUSE_TYPES)[number];

// --- Caching and History ---

export interface CacheEntry {
  data: AnalysisData;
  timestamp: number;
}

export interface SearchHistoryItem {
  schoolName: string;
  date: string;
}