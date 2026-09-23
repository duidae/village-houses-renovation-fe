import type { AnalysisData } from '../types';

export const mockAnalysisData: AnalysisData = {
  basicInfo: {
    name: '嘉義好宅範例',
    address: '嘉義市示範路 1 號',
    latitude: 23.4793,
    longitude: 120.4499,
    buildingType: '三合院',
    floorCount: 1,
    isHeritage: false,
    isRuralRevitalizationCommunity: true,
    communityOrgStatus: '運作穩定',
  },
  environmentalAnalysis: {
    localAttractions: ['文化公園', '農村市集'],
    localSpecialtyFoods: ['檜木炭火雞', '紅茶蛋糕'],
  },
  potentialIndex: {
    cpiScore: 82,
  },
  cityPopulation: [
    { year: 2020, population: 271000 },
    { year: 2025, population: 265000 },
  ],
  schoolEnrollment: [
    { year: 2020, studentCount: 180 },
    { year: 2025, studentCount: 150 },
  ],
  fiveForcesAnalysis: {
    industryRivalry: { score: 3, analysis: '同類社區照護服務數量穩定。' },
    threatOfNewEntrants: { score: 2, analysis: '補助門檻較高，新進者有限。' },
    bargainingPowerOfBuyers: { score: 4, analysis: '需求端集中且重視品質。' },
    bargainingPowerOfSuppliers: { score: 3, analysis: '地方人力與材料供應穩定。' },
    threatOfSubstituteProducts: { score: 3, analysis: '其他照護方案存在，但本案具在地優勢。' },
  },
};
