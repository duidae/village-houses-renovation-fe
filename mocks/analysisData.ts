import type { AnalysisData } from '../types';

export const mockAnalysisData: AnalysisData = {
  basicInfo: {
    name: '嘉義好宅範例',
    address: '嘉義市示範路 1 號',
    foundedYear: 1978,
    areaSqM: 840,
    buildingCoverage: 45,
    latitude: 23.4793,
    longitude: 120.4499,
  },
  environmentalAnalysis: {
    terrain: '平坦地形，鄰近田野與小溪',
    avgElevationM: 32,
    coastDistanceKm: 15,
    riverDistanceKm: 1.2,
    nearestStation: '嘉義火車站',
    transportationScore: 75,
    localAttractions: ['文化公園', '農村市集'],
    localSpecialtyFoods: ['檜木炭火雞', '紅茶蛋糕'],
  },
  potentialIndex: {
    cpiScore: 82,
    summary: '地點條件優良，轉型潛力高。',
  },
  recommendations: [
    {
      title: '轉型綠色照顧基地',
      description: '建議將建築活化為複合長照與社區交流空間。',
      reason: '鄰近醫療與公共交通，可串聯地方資源。',
    },
  ],
  strategicRecommendations: [
    {
      type: '社會需求型',
      project: '地方社區照顧中心',
      reason: '滿足在地長者日間照顧與服務需求。',
      policyAlignment: ['長照2.0', '地方創生'],
    },
  ],
  impactAssessment: {
    economic: [{ metric: '就業機會', value: '中', description: '可創造在地服務職缺。' }],
    social: [{ metric: '社會凝聚力', value: '高', description: '提供社區共用場域。' }],
    sustainability: [{ metric: '節能減碳', value: '中', description: '改造方案包含綠建材。' }],
    summary: '此案具備社會效益與產業轉型潛力。',
  },
  transformationAlternatives: [
    {
      title: '綠色照顧園區',
      description: '規劃長照服務、日照中心與多功能館。',
      alignment: '社區照護',
      potentialImpact: [{ metric: '在地就業', value: '增加 20%', description: '帶動周邊服務需求。' }],
      implementationSteps: ['場域評估', '設計改造', '試營運'],
      keyPartners: ['地方衛生所', '長照機構'],
      riskAnalysis: '需取得地方居民信任與穩定經費來源。',
    },
  ],
  pastCases: [
    {
      schoolName: '台南好宅',
      location: '台南市中心',
      originalCondition: '閒置校舍',
      revitalizationTheme: '老屋再生',
      outcome: '成功轉型為社區日照中心',
    },
  ],
  recentNews: {
    schoolNews: [{ title: '好宅案啟動', summary: '正式啟動社區活化計畫。', date: '2026-08-06' }],
    cityNews: [{ title: '地方創生補助', summary: '市府發布新一輪補助方案。', date: '2026-07-30' }],
  },
  cityPopulation: [
    { year: 2020, population: 271000 },
    { year: 2025, population: 265000 },
  ],
  schoolEnrollment: [
    { year: 2020, studentCount: 180 },
    { year: 2025, studentCount: 150 },
  ],
  trendProjection: {
    projectionData: [
      { year: 2026, projectedPopulation: 262000, projectedStudentCount: 145 },
      { year: 2030, projectedPopulation: 255000, projectedStudentCount: 130 },
    ],
    analysis: '人口持續下降，教育與照護需求呈現轉型趨勢。',
  },
  pestAnalysis: {
    political: '政府積極推動地方創生。',
    economic: '農業與觀光並重。',
    social: '高齡化趨勢明顯。',
    technological: '智慧照護技術成熟度提高。',
  },
  fiveForcesAnalysis: {
    industryRivalry: { score: 3, analysis: '同類社區照護服務數量穩定。' },
    threatOfNewEntrants: { score: 2, analysis: '補助門檻較高，新進者有限。' },
    bargainingPowerOfBuyers: { score: 4, analysis: '需求端集中且重視品質。' },
    bargainingPowerOfSuppliers: { score: 3, analysis: '地方人力與材料供應穩定。' },
    threatOfSubstituteProducts: { score: 3, analysis: '其他照護方案存在，但本案具在地優勢。' },
  },
  internalHealthMetrics: {
    enrollment: [{ metric: '入學率', value: '72%', analysis: '略低於區域平均。' }],
    financial: [{ metric: '營收穩定度', value: '中', analysis: '需提高多元收益。' }],
    brand: [{ metric: '知名度', value: '低', analysis: '仍需擴大宣傳。' }],
    operational: [{ metric: '維運效率', value: '中', analysis: '改造後可提升服務品質。' }],
  },
  swotAnalysis: {
    strengths: ['地點優勢', '管理團隊經驗'],
    weaknesses: ['資金短缺', '品牌能見度低'],
    opportunities: ['補助政策', '銀髮市場成長'],
    threats: ['市場競爭', '人口流失'],
  },
};
