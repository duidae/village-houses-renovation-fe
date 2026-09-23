

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
  schoolEnrollment: SchoolEnrollmentDataPoint[];
  fiveForcesAnalysis: FiveForcesAnalysis;
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