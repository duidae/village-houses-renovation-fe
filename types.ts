

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
  localAttractions: string[];
  localSpecialtyFoods: string[];
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

export interface ProjectionDataPoint {
  year: number;
  projectedPopulation: number;
  projectedStudentCount: number;
}

export interface TrendProjection {
    projectionData: ProjectionDataPoint[];
    analysis: string;
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

export interface StrategicRecommendation {
  type: '產業升級型' | '社會需求型' | '地方再生型';
  project: string;
  reason: string;
  policyAlignment: string[];
}

export interface ImpactMetric {
  metric: string;
  value: string;
  description: string;
}

export interface ImpactAssessment {
  economic: ImpactMetric[];
  social: ImpactMetric[];
  sustainability: ImpactMetric[];
  summary: string;
}

export interface TransformationAlternative {
  title: string;
  description: string;
  alignment: string;
  potentialImpact: ImpactMetric[];
  implementationSteps: string[];
  keyPartners: string[];
  riskAnalysis: string;
}


export interface AnalysisData {
  basicInfo: BasicInfo;
  environmentalAnalysis: EnvironmentalAnalysis;
  potentialIndex: PotentialIndex;
  recommendations: Recommendation[];
  strategicRecommendations: StrategicRecommendation[];
  impactAssessment: ImpactAssessment;
  transformationAlternatives: TransformationAlternative[];
  pastCases: PastCase[];
  recentNews: RecentNews;
  cityPopulation: PopulationDataPoint[];
  schoolEnrollment: SchoolEnrollmentDataPoint[];
  trendProjection: TrendProjection;
  pestAnalysis: PestAnalysis;
  fiveForcesAnalysis: FiveForcesAnalysis;
  internalHealthMetrics: InternalHealthMetrics;
  swotAnalysis: SwotAnalysis;
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