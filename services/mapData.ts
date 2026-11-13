import shp from 'shpjs';
import { researchAreaLabel } from './villageHousesService';

const LEAFLET_JS = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
const LEAFLET_CSS = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
const VILLAGE_BOUNDARIES_URL = '/village-boundaries.geojson';
const PUBLIC_FACILITIES_URL = '/layers/public-20260912T112511Z-1-001.zip';
const TRANSIT_FACILITIES_URL = '/transportation.geojson';

let leafletPromise: Promise<any> | null = null;

// Leaflet is loaded from the CDN on demand and shared by every map on the page.
export function loadLeaflet(): Promise<any> {
  const existing = (window as any).L;
  if (existing) return Promise.resolve(existing);
  if (!leafletPromise) {
    leafletPromise = new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = LEAFLET_CSS;
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = LEAFLET_JS;
      script.async = true;
      script.onload = () => resolve((window as any).L);
      script.onerror = () => {
        leafletPromise = null;
        reject(new Error('無法載入地圖元件'));
      };
      document.body.appendChild(script);
    });
  }
  return leafletPromise;
}

let villageBoundariesPromise: Promise<any> | null = null;

export function fetchVillageBoundaries(): Promise<any> {
  if (!villageBoundariesPromise) {
    villageBoundariesPromise = fetch(VILLAGE_BOUNDARIES_URL).then((res) => res.json());
  }
  return villageBoundariesPromise;
}

// The government boundary data uses 臺 (traditional) while our data sometimes
// uses 台 (common variant) for 台中/台南/台北/台東 etc.
const normalizeAreaText = (value: string) => value.replace(/台/g, '臺');

export function findVillageBoundary(boundaries: any, area: string): any | null {
  if (!boundaries) return null;
  const target = normalizeAreaText(area);
  return (
    boundaries.features.find(
      (feature: any) =>
        normalizeAreaText(
          researchAreaLabel({
            county: feature.properties.COUNTYNAME,
            township: feature.properties.TOWNNAME,
            village: feature.properties.VILLNAME,
          })
        ) === target
    ) ?? null
  );
}

let publicFacilitiesPromise: Promise<any> | null = null;

export function fetchPublicFacilities(): Promise<any> {
  if (!publicFacilitiesPromise) {
    publicFacilitiesPromise = shp(PUBLIC_FACILITIES_URL).catch((error: unknown) => {
      publicFacilitiesPromise = null;
      throw error;
    });
  }
  return publicFacilitiesPromise;
}

let transitFacilitiesPromise: Promise<any> | null = null;

export function fetchTransitFacilities(): Promise<any> {
  if (!transitFacilitiesPromise) {
    transitFacilitiesPromise = fetch(TRANSIT_FACILITIES_URL)
      .then((res) => res.json())
      .catch((error: unknown) => {
        transitFacilitiesPromise = null;
        throw error;
      });
  }
  return transitFacilitiesPromise;
}

// Environmental-sensitivity layers, shared by the overview map (MapBlock) and
// the 環境面 context map in the case report.
export const ENVIRONMENT_LAYER_SOURCES = [
  {
    id: 'meishan-fault',
    label: '梅山斷層地質敏感區',
    url: '/layers/meishan-fault.geojson',
    color: '#dc2626',
    type: 'geojson' as const,
  },
  {
    id: 'soil-liquefaction',
    label: '土壤液化潛勢',
    url: '/layers/soil-liquefaction.geojson',
    color: '#ea580c',
    type: 'geojson' as const,
    categoryField: 'type',
    categoryColors: {
      高潛勢: '#c2410c',
      中潛勢: '#f59e0b',
      低潛勢: '#facc15',
    } as Record<string, string>,
  },
  {
    // 24hr / 500mm scenario, clipped to within 2km of the research villages
    id: 'flood-potential',
    label: '淹水潛勢 (24hr 500mm)',
    url: '/layers/flood-potential-24h500mm.geojson',
    color: '#3b82f6',
    type: 'geojson' as const,
    weight: 0,
    categoryField: 'depth',
    categoryColors: {
      '0.3-0.5': '#bfdbfe',
      '0.5-1': '#60a5fa',
      '1-2': '#2563eb',
      '2-3': '#1e40af',
      '>3': '#172554',
    } as Record<string, string>,
  },
];

const geoJsonPromises: Record<string, Promise<any>> = {};

// Cached per URL so several maps on one page share a single download.
export function fetchGeoJson(url: string): Promise<any> {
  if (!geoJsonPromises[url]) {
    geoJsonPromises[url] = fetch(url)
      .then((res) => res.json())
      .catch((error: unknown) => {
        delete geoJsonPromises[url];
        throw error;
      });
  }
  return geoJsonPromises[url];
}
