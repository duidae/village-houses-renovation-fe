import type { AnalysisData } from '../types';
import type { PropertyMarker } from '../mocks/properties';

const CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vTsaWfKW2CrtMoHJ3F_M0gV4C5dCg6FdPGSNTkI00MwDrr99okfDYt6TpZPyO3X8w/pub?gid=318668856&single=true&output=csv';

const HEADER_MARKER = '宅院ID/編號';
const ROC_YEAR_OFFSET = 1911;
const POPULATION_ROC_YEARS = [111, 112, 113, 114, 115];

export interface VillageHouseRecord {
  id: string;
  lat: number;
  lng: number;
  county: string;
  township: string;
  village: string;
  community: string;
  isRuralRevitalizationCommunity: boolean;
  communityOrgStatus: string;
  localIndustries: string[];
  localCultureAndFestivals: string[];
  buildingType: string;
  floorCount: number | null;
  isHeritage: boolean;
  populationHistory: { year: number; population: number }[];
}

// Handles quoted fields (with embedded commas/newlines) and "" escaping, since
// several columns (e.g. historical population counts) are quoted numbers like "2,077".
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function toCount(value: string | undefined): number {
  if (!value) return 0;
  return Number(value.replace(/,/g, '')) || 0;
}

function splitList(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(/[、,，]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function parseVillageHouses(csvText: string): VillageHouseRecord[] {
  const rows = parseCsv(csvText);
  // The published sheet has two stacked header blocks; the second one is the
  // real, complete header that matches the data rows below it.
  const headerIndex = rows.map((r) => r[0]).lastIndexOf(HEADER_MARKER);
  if (headerIndex === -1) return [];

  const header = rows[headerIndex];
  const col = (name: string) => header.indexOf(name);

  const idxId = col('宅院ID/編號');
  const idxLng = col('經度X');
  const idxLat = col('緯度Y');
  const idxCounty = col('所在地-縣市');
  const idxTownship = col('所在地-鄉鎮');
  const idxVillage = col('所在地-村里');
  const idxCommunity = col('所在地-所在社區');
  const idxRuralRevital = col('是否為農村再生社區');
  const idxCommunityOrg = col('社會-社區組織運作狀況');
  const idxIndustries = col('社會-在地產業類型');
  const idxCulture = col('社會-地方特色活動與宗教文化');
  const idxFloors = col('樓層數(街景判斷)');
  const idxHeritage = col('身分屬性(是否具文資身分)');
  const idxBuildingType = col('建築型態');
  const populationCols = POPULATION_ROC_YEARS.map((rocYear) => ({
    year: rocYear + ROC_YEAR_OFFSET,
    idx: col(`社會-歷年人數(${rocYear})`),
  }));

  const records: VillageHouseRecord[] = [];
  for (let i = headerIndex + 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r[idxId]) continue;

    let lat = parseFloat(r[idxLat]);
    let lng = parseFloat(r[idxLng]);
    // A handful of rows have longitude/latitude swapped in the source sheet.
    // Valid latitudes for these sites are ~20-26; anything outside that means
    // the two columns were transposed for that row.
    if (lat > 26 || lat < 20) {
      [lat, lng] = [lng, lat];
    }
    if (Number.isNaN(lat) || Number.isNaN(lng)) continue;

    records.push({
      id: r[idxId],
      lat,
      lng,
      county: r[idxCounty] ?? '',
      township: r[idxTownship] ?? '',
      village: r[idxVillage] ?? '',
      community: r[idxCommunity] ?? '',
      isRuralRevitalizationCommunity: r[idxRuralRevital] === '是',
      communityOrgStatus: r[idxCommunityOrg] ?? '',
      localIndustries: splitList(r[idxIndustries]),
      localCultureAndFestivals: splitList(r[idxCulture]),
      buildingType: r[idxBuildingType] ?? '',
      floorCount: r[idxFloors] ? Number(r[idxFloors]) || null : null,
      isHeritage: r[idxHeritage] === '具文資身分' || r[idxHeritage] === '是',
      populationHistory: populationCols
        .map(({ year, idx }) => ({ year, population: toCount(r[idx]) }))
        .filter((p) => p.population > 0),
    });
  }
  return records;
}

let cachedRecords: Promise<VillageHouseRecord[]> | null = null;

export function fetchVillageHouses(): Promise<VillageHouseRecord[]> {
  if (!cachedRecords) {
    cachedRecords = fetch(CSV_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`無法取得農村好宅資料 (HTTP ${res.status})`);
        return res.text();
      })
      .then(parseVillageHouses)
      .catch((error) => {
        cachedRecords = null; // allow a retry on the next call
        throw error;
      });
  }
  return cachedRecords;
}

function houseLabel(record: VillageHouseRecord): string {
  const suffix = record.id.split('-').pop() ?? record.id;
  return `${record.community} 第${suffix}號宅院`;
}

// The source sheet has no renovation-potential score or market price, so both
// are derived here from the signals that do exist (building type, heritage
// status, rural-revitalization designation, population trend). These are
// heuristic placeholders, not measured/reported values.
function estimateScore(record: VillageHouseRecord): number {
  let score = 50;
  if (record.isHeritage) score += 20;
  if (record.isRuralRevitalizationCommunity) score += 10;
  if (['三合院', '單伸手', '一條龍'].includes(record.buildingType)) score += 10;

  const pop = record.populationHistory;
  if (pop.length >= 2 && pop[pop.length - 1].population < pop[0].population) {
    score += 10;
  }
  return Math.max(1, Math.min(100, score));
}

function estimatePrice(record: VillageHouseRecord): number {
  const base = 300;
  const perFloor = 150;
  return base + (record.floorCount ?? 1) * perFloor;
}

export function toPropertyMarker(record: VillageHouseRecord): PropertyMarker {
  const industriesText = record.localIndustries.slice(0, 3).join('、');
  return {
    id: record.id,
    name: houseLabel(record),
    lat: record.lat,
    lng: record.lng,
    description: `「${record.buildingType || '未分類'}」建築，位於${record.township}${record.village}${
      industriesText ? `，在地產業：${industriesText}` : ''
    }`,
    renovationStatus: 'planning',
    price: estimatePrice(record),
    score: estimateScore(record),
  };
}

export function toPropertyMarkers(records: VillageHouseRecord[]): PropertyMarker[] {
  return records.map(toPropertyMarker);
}

// Overlays the fields we can ground in real data onto a base AnalysisData
// (e.g. mockAnalysisData). Everything else in AnalysisData is narrative/
// strategic analysis that this dataset doesn't contain, so it's left as-is.
export function buildAnalysisDataForRecord(base: AnalysisData, record: VillageHouseRecord): AnalysisData {
  return {
    ...base,
    basicInfo: {
      ...base.basicInfo,
      name: houseLabel(record),
      address: `${record.county}${record.township}${record.village}${record.community}`,
      latitude: record.lat,
      longitude: record.lng,
    },
    environmentalAnalysis: {
      ...base.environmentalAnalysis,
      localAttractions: record.localCultureAndFestivals.length > 0
        ? record.localCultureAndFestivals
        : base.environmentalAnalysis.localAttractions,
      localSpecialtyFoods: record.localIndustries.length > 0
        ? record.localIndustries
        : base.environmentalAnalysis.localSpecialtyFoods,
    },
    cityPopulation: record.populationHistory.length > 0
      ? record.populationHistory.map((p) => ({ year: p.year, population: p.population }))
      : base.cityPopulation,
  };
}
