
export interface BasicInfo {
  name: string;
  address: string;
  foundedYear: number;
  areaSqM: number;
  buildingCoverage: number;
  latitude: number;
  longitude: number;
}

export interface EnvironmentalAnalysis {
  terrain: string;
  avgElevationM: number;
  coastDistanceKm: number;
  riverDistanceKm: number;
  nearestStation: string;
  transportationScore: number;
}

export interface PotentialIndex {
  cpiScore: number;
  summary: string;
}

export interface Recommendation {
  title: string;
  description: string;
  reason: string;
}

export interface PastCase {
  schoolName: string;
  location: string;
  originalCondition: string;
  revitalizationTheme: string;
  outcome: string;
}

export interface NewsItem {
  title: string;
  summary: string;
  date: string;
}

export interface RecentNews {
  schoolNews: NewsItem[];
  cityNews: NewsItem[];
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

export interface PestAnalysis {
  political: string;
  economic: string;
  social: string;
  technological: string;
}

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

export interface MetricItem {
  metric: string;
  value: string;
  analysis: string;
}

export interface InternalHealthMetrics {
  enrollment: MetricItem[];
  financial: MetricItem[];
  brand: MetricItem[];
  operational: MetricItem[];
}

export interface SwotAnalysis {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export interface SchoolHealthIndex {
  score: number;
  level: 'Excellent' | 'Good' | 'Fair' | 'Critical';
  summary: string;
}

export interface AnalysisData {
  basicInfo: BasicInfo;
  environmentalAnalysis: EnvironmentalAnalysis;
  potentialIndex: PotentialIndex;
  recommendations: Recommendation[];
  pastCases: PastCase[];
  recentNews: RecentNews;
  cityPopulation: PopulationDataPoint[];
  schoolEnrollment: SchoolEnrollmentDataPoint[];
  pestAnalysis: PestAnalysis;
  fiveForcesAnalysis: FiveForcesAnalysis;
  internalHealthMetrics: InternalHealthMetrics;
  swotAnalysis: SwotAnalysis;
  schoolHealthIndex: SchoolHealthIndex;
}
