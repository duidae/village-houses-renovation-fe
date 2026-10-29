import type { AspectAnalysis, ConditionOption, ConnectivityOption } from '../types';
import type { VillageHouseRecord } from '../services/villageHousesService';

// 社區連結 from the sheet's 公共服務設施-* columns (1/3/5). Each option is that
// column's top grade (5):
// - 道路系統: <=30m from a main road (鄉道/縣道)
// - 公共服務設施: a welcomed facility (圖書館、學校、社區活動中心) within 300m
// - 公共運輸站點: <=300m to a public transport stop, or <=500m to a train station
export function getConnectivity(record: VillageHouseRecord): ConnectivityOption[] {
  const options: ConnectivityOption[] = [];
  if (record.roadAccess === 5) options.push('地點佳，主幹道上');
  if (record.publicFacilities === 5) options.push('有公共設施，方圓半徑300公尺內有迎毗設施');
  if (record.transitAccess === 5) options.push('交通佳，300m內有公共運輸站點或500m內有火車站');
  return options;
}

// 建築物狀況 text and fallback score for the sheet's 高/中/低 level.
const CONDITION_ASPECTS: Record<ConditionOption, { score: number; analysis: string }> = {
  高: { score: 9, analysis: '建築物狀況評估為**高**，結構與維護狀態良好。' },
  中: { score: 6.5, analysis: '建築物狀況評估為**中**，部分項目需維護。' },
  低: { score: 4, analysis: '建築物狀況評估為**低**，整建前需詳細調查。' },
};

const CONNECTIVITY_LABELS: Record<ConnectivityOption, string> = {
  '地點佳，主幹道上': '位於主幹道上',
  '有公共設施，方圓半徑300公尺內有迎毗設施': '300公尺內有迎毗設施',
  '交通佳，300m內有公共運輸站點或500m內有火車站': '300公尺內有公共運輸站點或500公尺內有火車站',
};

// Courtyard layout and historical value follow the building type, from most to
// least traditional/complete layout.
const LAYOUT_SCORES: { pattern: RegExp; layout: number; history: number; note: string }[] = [
  { pattern: /三合院|四合院/, layout: 9, history: 7, note: '具完整中庭，適合作為公共活動空間' },
  { pattern: /單伸手/, layout: 7, history: 6, note: '具半圍合前埕，可延伸戶外活動空間' },
  { pattern: /一條龍/, layout: 5, history: 5, note: '前埕開闊但空間較線性，需規劃動線' },
  { pattern: /水泥連棟/, layout: 3, history: 2, note: '連棟式建築缺乏院落，戶外空間有限' },
];

// The sheet's A-D雷達值 are 0-100; the radar chart uses 0-10.
const toTenPointScale = (score: number) => Math.round(score) / 10;

// 宅院面向分析: scores come from the sheet's A-D雷達值 when present, otherwise
// 社區連結 is derived from the 公共服務設施 grades above, 建築物狀況 from the sheet's
// 建築物狀況 level, and 歷史價值 and 院落配置 from the sheet's 建築型態 and
// 文資身分. The analysis text is always derived that way.
export function estimateAspectAnalysis(record: VillageHouseRecord): AspectAnalysis {
  const connectivity = getConnectivity(record);
  const condition = record.buildingCondition ? CONDITION_ASPECTS[record.buildingCondition] : null;
  const layout = LAYOUT_SCORES.find(({ pattern }) => pattern.test(record.buildingType));
  const buildingType = record.buildingType || '未分類';
  const sheetScores = record.aspectScores;

  return {
    communityConnection: {
      score: sheetScores ? toTenPointScale(sheetScores.communityConnection) : 4 + connectivity.length * 2,
      analysis: connectivity.length > 0
        ? `${connectivity.map((option) => `**${CONNECTIVITY_LABELS[option]}**`).join('、')}。`
        : '未位於主幹道，周邊**公共設施與大眾運輸**皆較遠。',
    },
    buildingCondition: {
      score: sheetScores ? toTenPointScale(sheetScores.buildingCondition) : condition?.score ?? 5,
      analysis: condition?.analysis ?? '建築物狀況**待評估**，整建前需現地調查。',
    },
    historicalValue: {
      score: sheetScores
        ? toTenPointScale(sheetScores.historicalValue)
        : Math.min(10, (layout?.history ?? 4) + (record.isHeritage ? 3 : 0)),
      analysis: record.isHeritage
        ? `具**文化資產身分**，建築型態為**${buildingType}**。`
        : `建築型態為**${buildingType}**，尚未具文資身分。`,
    },
    courtyardLayout: {
      score: sheetScores ? toTenPointScale(sheetScores.courtyardLayout) : layout?.layout ?? 4,
      analysis: `**${buildingType}**格局，${layout?.note ?? '院落配置需現地確認'}。`,
    },
  };
}
