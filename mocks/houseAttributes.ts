import type { ConditionOption, ConnectivityOption, ReuseType } from '../types';
import type { VillageHouseRecord } from '../services/villageHousesService';

// MOCK DATA: the source sheet has no reuse-type, road/transit/amenity or
// building-condition data yet (the 公共服務設施-* columns exist but are empty).
// These placeholders let the filters work end to end; replace each function
// with the real column once the sheet has it.

const REUSE_RULES: { type: ReuseType; pattern: RegExp; fields: (r: VillageHouseRecord) => string }[] = [
  {
    type: '食農教育體驗型',
    pattern: /稻|米|番茄|瓜|鳳梨|蔬菜|果|筍|柑|梨|芭樂|柚|龍眼|荔枝|楊桃|檸檬|葡萄|蓮|甘藷|玉米|棗|柳丁|梔子花|農業/,
    fields: (r) => r.localIndustries.join('、'),
  },
  {
    type: '產業加工營運型',
    pattern: /加工|粿|皮蛋|綠豆簧|工業|倉儲/,
    fields: (r) => r.localIndustries.join('、'),
  },
  {
    type: '農遊體驗服務型',
    pattern: /觀光|休閒|漁業/,
    fields: (r) => r.localIndustries.join('、'),
  },
  {
    type: '文化保存展示型',
    // Nearly every village has a temple, so only stronger heritage signals count.
    pattern: /文物館|文化館|古厝|老街|古蹟|歷史建築|文史/,
    fields: (r) => [...r.localCultureAndFestivals, r.communityOrgStatus].join('、'),
  },
  {
    type: '照顧療育服務型',
    pattern: /關懷據點|照顧|共餐|送餐|長照/,
    fields: (r) => r.communityOrgStatus,
  },
  {
    type: '社區健康促進型',
    pattern: /健康|延緩失能|失智/,
    fields: (r) => r.communityOrgStatus,
  },
  {
    type: '地方技藝培育型',
    pattern: /手工藝|技藝|編織|工藝/,
    fields: (r) => r.communityOrgStatus,
  },
  {
    type: '兒少/數位共學服務型',
    pattern: /課程|共學|兒童|學童|課輔|數位/,
    fields: (r) => r.communityOrgStatus,
  },
  {
    type: '社區安全韌性型',
    pattern: /防災|巡守|守望/,
    fields: (r) => r.communityOrgStatus,
  },
  {
    type: '社區生活共享型',
    pattern: /志工|社區營造|綠美化/,
    fields: (r) => r.communityOrgStatus,
  },
];

// Rule-based estimate from the building type, local industries, culture and
// community-organisation text.
export function estimateReuseTypes(record: VillageHouseRecord): ReuseType[] {
  const types = new Set<ReuseType>(
    REUSE_RULES.filter(({ pattern, fields }) => pattern.test(fields(record))).map(({ type }) => type)
  );
  if (record.isHeritage || record.buildingType === '三合院') types.add('文化保存展示型');
  // Multi-storey / row-house buildings have room for shared workspaces.
  if (record.buildingType.startsWith('水泥連棟式') || (record.floorCount ?? 1) >= 2) {
    types.add('青年創業共創型');
  }
  if (types.size === 0) types.add('社區生活共享型');
  return [...types];
}

// Stable pseudo-random value in [0, 1) per house + key, so mock values don't
// change between reloads.
function hashUnit(id: string, key: string): number {
  let hash = 2166136261;
  for (const char of `${id}:${key}`) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 2 ** 32;
}

export function mockConnectivity(record: VillageHouseRecord): ConnectivityOption[] {
  const options: ConnectivityOption[] = [];
  if (hashUnit(record.id, 'mainRoad') < 0.4) options.push('地點佳，主幹道上');
  if (hashUnit(record.id, 'amenity') < 0.5) options.push('有公共設施，方圓半徑300公尺內有迎毗設施');
  if (hashUnit(record.id, 'transit') < 0.3) options.push('交通佳，至最近公共運輸站點的直線距離<=300m');
  return options;
}

export function mockCondition(record: VillageHouseRecord): ConditionOption[] {
  const options: ConditionOption[] = [];
  if (hashUnit(record.id, 'structure') < 0.6) options.push('結構狀態良好');
  if (hashUnit(record.id, 'maintenance') < 0.5) options.push('維護狀態良好');
  return options;
}
