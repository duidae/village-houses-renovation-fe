import type { AspectAnalysis } from '../types';

// 面向分析雷達圖5個層級的文字說明 (個宅再利用類型整理_1027): the meaning of each
// 20-point band of the sheet's A-D雷達值 (0-100), lowest level first.
export const ASPECT_LEVEL_DESCRIPTIONS: Record<keyof AspectAnalysis, readonly [string, string, string, string, string]> = {
  communityConnection: [
    '主要活動範圍，周邊公共設施及交通資源較少',
    '可連結少數公共設施或交通資源，但整體可及性仍有限',
    '具基本公共設施及交通資源，可形成一定的對外連結',
    '鄰近多項公共設施且交通便利，具良好的對外連結條件',
    '區位條件佳，公共設施及交通資源完整，具高度對外連結性',
  ],
  historicalValue: [
    '建築形式、屋頂及材料多已現代化，或難以辨識',
    '傳統建築形式、屋頂、材料及細部特徵整體較不明顯',
    // Same wording as level 2 in the source document.
    '傳統建築形式、屋頂、材料及細部特徵整體較不明顯',
    '仍可辨識傳統建築特徵，但整體傳統特色較弱',
    '傳統建築形式、屋頂及材料特徵明顯且清楚可辨',
  ],
  buildingCondition: [
    '結構受損明顯且缺乏維護，需大幅修繕',
    '結構或構件有明顯損壞，整體修繕需求較高',
    '主要結構尚可，局部構件及環境需修繕整理',
    '主要結構完整，僅需局部修繕或維護即可使用',
    '結構與各部構件保存良好，整體維護狀況佳',
  ],
  courtyardLayout: [
    '院落空間不完整，鋪面、圍牆及綠化等環境條件較差',
    '尚有院落空間，但配置零散，鋪面或環境整理需求較高',
    '院落空間可使用，具基本配置、鋪面及綠化條件',
    '院落配置完整，鋪面、圍牆及綠化等環境條件良好',
    '院落空間完整且配置適當，鋪面、圍牆與綠化整體協調',
  ],
};

// Level 1-5 for a 0-100 score. Each band includes its lower bound (20 is level
// 2, 40 is level 3, ...), and 100 is level 5.
export function getAspectLevel(score: number): 1 | 2 | 3 | 4 | 5 {
  return Math.min(5, Math.max(1, Math.floor(score / 20) + 1)) as 1 | 2 | 3 | 4 | 5;
}

export function describeAspectLevel(aspect: keyof AspectAnalysis, score: number): string {
  return ASPECT_LEVEL_DESCRIPTIONS[aspect][getAspectLevel(score) - 1];
}
