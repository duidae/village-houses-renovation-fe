#!/usr/bin/env node
// Regenerates public/village-boundaries.geojson: the 村(里)界 polygons for the
// villages referenced by the 農村好宅 dataset, used to draw a boundary outline
// on the map when a 研究基地 (county+township+village) option is selected.
//
// Source data:
// - Village boundaries: 內政部國土測繪中心 村(里)界(TWD97經緯度), via data.gov.tw
//   dataset 7438 (https://data.gov.tw/dataset/7438).
// - Village names: the same Google Sheet the app fetches at runtime.
//
// The national shapefile is ~20MB, far too large to ship to the browser, so
// this script pre-filters it down to just the villages this app cares about.
// Re-run it whenever the sheet gains a village not already in the output file.
//
// Usage: node scripts/build-village-boundaries.mjs

import shp from 'shpjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const VILLAGE_SHAPEFILE_ZIP_URL =
  'https://www.tgos.tw/tgos/VirtualDir/Product/a04697c8-64db-450a-a105-3eb471c45abd/村(里)界(TWD97經緯度).zip';

const VILLAGE_HOUSES_CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vTsaWfKW2CrtMoHJ3F_M0gV4C5dCg6FdPGSNTkI00MwDrr99okfDYt6TpZPyO3X8w/pub?gid=318668856&single=true&output=csv';

const OUTPUT_PATH = path.join(__dirname, '..', 'public', 'village-boundaries.geojson');

// Minimal CSV parser mirroring services/villageHousesService.ts (handles
// quoted fields with embedded commas, since some columns quote numbers).
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else { inQuotes = false; }
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(field); field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    } else {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}

function getVillageTriplets(csvText) {
  const rows = parseCsv(csvText);
  const headerIndex = rows.map((r) => r[0]).lastIndexOf('宅院ID/編號');
  const header = rows[headerIndex];
  const col = (name) => header.indexOf(name);
  const idxId = col('宅院ID/編號');
  const idxCounty = col('所在地-縣市');
  const idxTownship = col('所在地-鄉鎮');
  const idxVillage = col('所在地-村里');

  const seen = new Set();
  const triplets = [];
  for (let i = headerIndex + 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r[idxId]) continue;
    const key = `${r[idxCounty]}|${r[idxTownship]}|${r[idxVillage]}`;
    if (seen.has(key)) continue;
    seen.add(key);
    triplets.push({ county: r[idxCounty], township: r[idxTownship], village: r[idxVillage] });
  }
  return triplets;
}

// The government shapefile uses 臺 (traditional) while the sheet sometimes
// uses 台 (common variant) for 台中/台南/台北/台東 etc. Normalize before matching.
const normalize = (value) => value.replace(/台/g, '臺');

async function main() {
  console.log('Fetching village house locations...');
  const csvText = await fetch(VILLAGE_HOUSES_CSV_URL).then((r) => r.text());
  const triplets = getVillageTriplets(csvText);
  console.log(`Found ${triplets.length} unique county/township/village combinations.`);

  console.log('Downloading national village boundary shapefile (~20MB)...');
  const zipBuffer = await fetch(VILLAGE_SHAPEFILE_ZIP_URL).then((r) => r.arrayBuffer());

  console.log('Parsing shapefile...');
  const parsed = await shp(zipBuffer);
  const geojson = Array.isArray(parsed)
    ? parsed.reduce((largest, g) => (g.features.length > largest.features.length ? g : largest))
    : parsed;
  console.log(`Shapefile has ${geojson.features.length} villages nationwide.`);

  const matched = [];
  const unmatched = [];
  for (const { county, township, village } of triplets) {
    const feature = geojson.features.find(
      (f) =>
        normalize(f.properties.COUNTYNAME) === normalize(county) &&
        normalize(f.properties.TOWNNAME) === normalize(township) &&
        normalize(f.properties.VILLNAME) === normalize(village)
    );
    if (feature) matched.push(feature);
    else unmatched.push({ county, township, village });
  }

  if (unmatched.length > 0) {
    console.warn('Could not find a boundary for:', unmatched);
  }

  const output = { type: 'FeatureCollection', features: matched };
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output));
  console.log(`Wrote ${matched.length} village boundaries to ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
