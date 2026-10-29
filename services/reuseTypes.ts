import type { AspectAnalysis, ReuseSuggestion, ReuseType } from '../types';
import { atLeast, getAspectGrade, type AspectGrade } from './aspectLevels';

// 個宅再利用類型整理 (1027): what each reuse type offers and example venues.
export const REUSE_TYPE_INFO: Record<ReuseType, { function: string; examples: string[] }> = {
  照顧療育服務型: {
    function: '提供高齡照顧、共餐、健康促進、療育及陪伴使用',
    examples: ['綠照據點', '樂齡活動空間', '農村共餐食堂', '社區灶咖', '園藝療育基地', '療育庭院', '青銀共學空間'],
  },
  社區生活共享型: {
    function: '提供居民日常交流、聚會、共同使用與社區活動',
    examples: ['社區客廳', '共享廚房', '閱讀室', '社區會議空間', '共享活動空間'],
  },
  文化保存展示型: {
    function: '提供地方文化、歷史記憶及農村生活展示與傳承',
    examples: ['地方故事館', '農村記憶館', '農村老物件展示館', '地方文史館'],
  },
  地方技藝培育型: {
    function: '提供技藝傳習、創作、實作及人才培育',
    examples: ['職人工坊', '農村技藝學堂', '竹藝/草編工坊', '地方材料實驗室', '文化商品開發工作室', '駐村工藝基地'],
  },
  食農教育體驗型: {
    function: '提供食農、農事、環境與永續教育及體驗',
    examples: ['食農教室', '農村料理學堂', '農事體驗基地', '里山學堂', '低碳生活教室', '親子食農基地'],
  },
  產業加工營運型: {
    function: '提供生產、加工、餐飲、展示、銷售與產業經營',
    examples: ['農村品牌選物店', '農產展售所', '社區合作社', '農產加工空間', '農業剩餘資材再生基地'],
  },
  青年創業共創型: {
    function: '提供青年進駐、工作、創業、實驗及跨域共創',
    examples: ['返鄉青年工作站', '農村青創基地', '農村創客基地', '地方品牌實驗室', '微型創業工作室', '地方創生基地'],
  },
  農遊體驗服務型: {
    function: '提供遊客接待、導覽、休憩、資訊與體驗服務',
    examples: [
      '農村旅人驛站', '地方生活案內所', '農遊服務站', '遊程集合中心',
      '導覽解說站', '農村生活體驗館', '農遊休憩站', '農村體驗預約中心',
    ],
  },
  社區安全韌性型: {
    function: '提供平時公共使用、災時轉換為應變支援之彈性空間',
    examples: ['社區防災據點', '臨時避難空間', '物資儲備站', '災時資訊站'],
  },
  '兒少/數位共學服務型': {
    function: '提供兒童及青少年安全的學習、陪伴與交流空間；或是提供居民數位學習服務',
    examples: [
      '課後陪伴空間', '親子共學基地', '地方學堂', '青銀共學空間',
      '農村數位學習站', '長者手機教室', '數位服務站', '青年數位工作站',
    ],
  },
  社區健康促進型: {
    function: '提供一般居民日常健康維持、運動、營養及健康學習',
    examples: ['社區健康站', '健康量測站', '農村運動教室', '銀髮體適能空間', '健康講堂', '健康生活教室'],
  },
};

type Aspect = keyof AspectAnalysis;
type Condition = [Aspect, AspectGrade]; // aspect must be at least this grade

// 組合條件 → 主要建議. Every condition must hold.
const COMBINED_RULES: { type: ReuseType; conditions: Condition[] }[] = [
  { type: '照顧療育服務型', conditions: [['buildingCondition', '高'], ['courtyardLayout', '中']] },
  { type: '社區生活共享型', conditions: [['communityConnection', '中'], ['courtyardLayout', '中']] },
  { type: '文化保存展示型', conditions: [['historicalValue', '高'], ['communityConnection', '中']] },
  { type: '地方技藝培育型', conditions: [['historicalValue', '高'], ['buildingCondition', '中']] },
  { type: '食農教育體驗型', conditions: [['communityConnection', '中'], ['courtyardLayout', '中']] },
  { type: '產業加工營運型', conditions: [['buildingCondition', '高'], ['communityConnection', '高']] },
  { type: '青年創業共創型', conditions: [['buildingCondition', '高'], ['communityConnection', '中']] },
  { type: '農遊體驗服務型', conditions: [['communityConnection', '高'], ['courtyardLayout', '中']] },
  { type: '社區安全韌性型', conditions: [['buildingCondition', '高'], ['communityConnection', '高']] },
  { type: '兒少/數位共學服務型', conditions: [['buildingCondition', '中'], ['communityConnection', '高']] },
  {
    type: '社區健康促進型',
    conditions: [['buildingCondition', '高'], ['courtyardLayout', '中'], ['communityConnection', '中']],
  },
];

// 單一條件 → 其他適合方向. The document lists 院落配置 中 and 歷史價值 中/高; both
// are read as 中以上.
const SINGLE_RULES: { condition: Condition; types: ReuseType[] }[] = [
  {
    condition: ['communityConnection', '高'],
    types: ['社區生活共享型', '食農教育體驗型', '產業加工營運型', '青年創業共創型', '農遊體驗服務型'],
  },
  { condition: ['historicalValue', '中'], types: ['文化保存展示型', '地方技藝培育型'] },
  { condition: ['buildingCondition', '高'], types: ['兒少/數位共學服務型', '社區安全韌性型'] },
  { condition: ['courtyardLayout', '中'], types: ['照顧療育服務型', '社區健康促進型'] },
];

// 再利用類型建議 from the four 0-100 aspect scores. 主要建議 come from the combined
// rules; 其他適合方向 from the single rules, minus anything already in 主要建議.
export function suggestReuseTypes(scores: Record<Aspect, number> | null): ReuseSuggestion {
  if (!scores) return { primary: [], other: [] };

  const meets = ([aspect, minimum]: Condition) => atLeast(getAspectGrade(scores[aspect]), minimum);
  const primary = COMBINED_RULES.filter(({ conditions }) => conditions.every(meets)).map(({ type }) => type);
  const other = new Set<ReuseType>();
  for (const { condition, types } of SINGLE_RULES) {
    if (!meets(condition)) continue;
    types.filter((type) => !primary.includes(type)).forEach((type) => other.add(type));
  }
  return { primary, other: [...other] };
}
