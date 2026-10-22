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
