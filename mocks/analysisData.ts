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
  reuseTypes: ['文化保存展示型', '食農教育體驗型'],
  aspectAnalysis: {
    communityConnection: { score: 6, analysis: '鄰近**社區活動中心**，步行可達。' },
    buildingCondition: { score: 7, analysis: '主體**結構狀態良好**，部分屋瓦需修繕。' },
    historicalValue: { score: 7, analysis: '傳統**三合院**格局保存完整。' },
    courtyardLayout: { score: 9, analysis: '**三合院**具完整中庭，適合作為公共活動空間。' },
  },
};
