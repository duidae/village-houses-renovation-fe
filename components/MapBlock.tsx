import React, { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import shp from 'shpjs';
import type { PropertyMarker } from '../mocks/properties';
import { fetchProperties } from '../services/propertiesService';
import { researchAreaLabel } from '../services/villageHousesService';

const defaultCenter = [23.4789, 120.447];
const defaultZoom = 8;
const mapLayerSources = [
  {
    id: 'key-area',
    label: '重點區域',
    url: '/layers/key_area-20260912T112510Z-1-001.zip',
    color: '#0f766e',
    type: 'shp' as const,
  },
  {
    id: 'public-facilities',
    label: '公共設施',
    url: '/layers/public-20260912T112511Z-1-001.zip',
    color: '#2563eb',
    type: 'shp' as const,
  },
  {
    id: 'public-facilities-geojson',
    label: '公共設施資料',
    url: '/public-facilities.geojson',
    color: '#9333ea',
    type: 'geojson' as const,
  },
];

const VILLAGE_BOUNDARIES_URL = '/village-boundaries.geojson';

// The government boundary data uses 臺 (traditional) while our data sometimes
// uses 台 (common variant) for 台中/台南/台北/台東 etc.
const normalizeAreaText = (value: string) => value.replace(/台/g, '臺');

const formatPrice = (price: number) => `${price.toLocaleString('zh-TW')} 萬`;

const getScoreLevelColor = (score: number) => {
  if (score >= 80) return '#ef4444'; // high - red
  if (score >= 60) return '#f97316'; // mid - orange
  return '#9ca3af'; // low - grey
};

const getScoreLevelText = (score: number) => {
  if (score >= 80) return '高';
  if (score >= 60) return '中';
  return '低';
};

interface MapBlockProps {
  selectedResearchBase?: string;
  onSelectResearchBase?: (researchBaseId: string) => void;
  selectedPotential?: '全部' | '高' | '中' | '低';
  onViewAnalysis?: () => void;
  showAnalysisButton?: boolean;
}

const MapBlock: React.FC<MapBlockProps> = ({
  selectedResearchBase = '全部',
  onSelectResearchBase,
  selectedPotential = '全部',
  onViewAnalysis,
  showAnalysisButton = true,
}) => {
  const [selectedProperty, setSelectedProperty] = useState<PropertyMarker | null>(
    null
  );
  const [properties, setProperties] = useState<PropertyMarker[]>([]);
  const [villageBoundaries, setVillageBoundaries] = useState<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [enabledMapLayers, setEnabledMapLayers] = useState<Record<string, boolean>>(
    () => Object.fromEntries(mapLayerSources.map(({ id }) => [id, false]))
  );
  const enabledMapLayersRef = useRef(enabledMapLayers);
  const mapRef = useRef<any>(null);
  const mapLayerGroupsRef = useRef<Record<string, any>>({});

  React.useEffect(() => {
    enabledMapLayersRef.current = enabledMapLayers;
    Object.entries(mapLayerGroupsRef.current).forEach(([id, layer]) => {
      const map = mapRef.current;
      if (!map) return;

      if (enabledMapLayers[id]) {
        layer.addTo(map);
      } else {
        layer.removeFrom(map);
      }
    });
  }, [enabledMapLayers]);

  React.useEffect(() => {
    fetchProperties().then(setProperties);
  }, []);

  React.useEffect(() => {
    fetch(VILLAGE_BOUNDARIES_URL)
      .then((res) => res.json())
      .then(setVillageBoundaries)
      .catch((error) => console.error('Unable to load village boundaries:', error));
  }, []);

  const visibleProperties = useMemo(() => {
    const byResearchBase = (() => {
      if (selectedResearchBase === '全部') return properties;

      const byHouse = properties.filter((property) => property.id === selectedResearchBase);
      if (byHouse.length > 0) return byHouse;

      return properties.filter((property) => researchAreaLabel(property) === selectedResearchBase);
    })();

    if (selectedPotential === '全部') return byResearchBase;
    return byResearchBase.filter((property) => getScoreLevelText(property.score) === selectedPotential);
  }, [properties, selectedResearchBase, selectedPotential]);

  // The area a boundary should be drawn for: either selectedResearchBase is
  // already a county+township+village string, or it's a single house's id,
  // in which case we derive that house's area.
  const activeResearchArea = useMemo(() => {
    if (selectedResearchBase === '全部') return null;
    const selectedHouse = properties.find((property) => property.id === selectedResearchBase);
    return selectedHouse ? researchAreaLabel(selectedHouse) : selectedResearchBase;
  }, [properties, selectedResearchBase]);

  const activeBoundaryFeature = useMemo(() => {
    if (!activeResearchArea || !villageBoundaries) return null;
    return villageBoundaries.features.find(
      (feature: any) =>
        normalizeAreaText(researchAreaLabel({
          county: feature.properties.COUNTYNAME,
          township: feature.properties.TOWNNAME,
          village: feature.properties.VILLNAME,
        })) === normalizeAreaText(activeResearchArea)
    ) ?? null;
  }, [activeResearchArea, villageBoundaries]);

  React.useEffect(() => {
    setSelectedProperty(visibleProperties.length === 1 ? visibleProperties[0] : null);
  }, [selectedResearchBase, properties]);

  React.useEffect(() => {
    // Load Leaflet CSS and JS dynamically
    const loadLeaflet = async () => {
      // Check if Leaflet is already loaded
      if ((window as any).L) {
        setMapLoaded(true);
        return;
      }

      // Load CSS
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href =
        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
      document.head.appendChild(link);

      // Load JS
      const script = document.createElement('script');
      script.src =
        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
      script.async = true;
      script.onload = () => setMapLoaded(true);
      document.body.appendChild(script);
    };

    loadLeaflet();
  }, []);

  React.useEffect(() => {
    if (!mapLoaded) return;

    const L = (window as any).L;
    const mapContainer = document.getElementById('map-container');
    if (!mapContainer) return;

    // Initialize map
    const initialView =
      visibleProperties.length === 1
        ? ([visibleProperties[0].lat, visibleProperties[0].lng] as [number, number])
        : defaultCenter;
    const initialZoom = visibleProperties.length === 1 ? 17 : defaultZoom;
    const map = L.map('map-container').setView(initialView, initialZoom);
    mapRef.current = map;

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    let layersCancelled = false;

    const loadShapeLayers = async () => {
      await Promise.all(
        mapLayerSources.map(async ({ id, url, color, type }) => {
          try {
            const geoJson = type === 'geojson' ? await fetch(url).then((res) => res.json()) : await shp(url);
            if (layersCancelled) return;

            const layer = L.geoJSON(geoJson, {
              style: {
                color,
                fillColor: color,
                fillOpacity: 0.12,
                opacity: 0.8,
                weight: 2,
              },
              pointToLayer: (_feature: unknown, latLng: unknown) =>
                L.circleMarker(latLng, {
                  radius: 5,
                  color,
                  fillColor: '#ffffff',
                  fillOpacity: 0.9,
                  weight: 2,
                }),
            });
            mapLayerGroupsRef.current[id] = layer;
            if (enabledMapLayersRef.current[id]) layer.addTo(map);
          } catch (error) {
            console.error(`Unable to load map layer: ${url}`, error);
          }
        })
      );
    };

    loadShapeLayers();

    // Draw the selected research area's village boundary, if we have one
    if (activeBoundaryFeature) {
      const boundaryLayer = L.geoJSON(activeBoundaryFeature, {
        style: {
          color: '#dc2626',
          weight: 3,
          fillColor: '#dc2626',
          fillOpacity: 0.06,
          dashArray: '6 4',
        },
      }).addTo(map);

      if (visibleProperties.length !== 1) {
        map.fitBounds(boundaryLayer.getBounds(), { padding: [24, 24] });
      }
    }

    // Add markers for each property
    visibleProperties.forEach((property) => {
      const scoreColor = getScoreLevelColor(property.score);
      const isHighScore = property.score >= 80;

      // Create custom marker HTML with a price tag above the pin
      const markerHtml = `
        <div style="display: flex; flex-direction: column; align-items: center;">
          <div style="
            background-color: white;
            color: #1e293b;
            font-size: 17px;
            font-weight: bold;
            padding: 3px 12px;
            border-radius: 15px;
            border: 2.25px solid ${scoreColor};
            box-shadow: 0 1.5px 6px rgba(0,0,0,0.25);
            white-space: nowrap;
            margin-bottom: 3px;
            text-align: center;
          ">
            ${property.name}<br/>${formatPrice(property.price)} · 分數 ${property.score}
          </div>
          <div style="
            background-color: ${scoreColor};
            width: 45px;
            height: 45px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 4.5px solid white;
            box-shadow: 0 3px 12px rgba(0,0,0,0.3);
            cursor: pointer;
            font-weight: bold;
            color: white;
            font-size: 24px;
          ">
            🏠
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: '',
        iconSize: [105, 84],
        iconAnchor: [53, 68],
        popupAnchor: [0, -68],
      });

      const marker = L.marker([property.lat, property.lng], {
        icon: customIcon,
      }).addTo(map);

      marker.bindPopup(`
        <div style="font-family: sans-serif; color: #333;">
          <h3 style="margin: 0 0 6px 0; font-size: 14px; font-weight: bold;">${property.name}</h3>
          <p style="margin: 0 0 10px 0; font-size: 13px; font-weight: bold; color: #0f172a;">${formatPrice(property.price)}</p>
          <p style="margin: 0 0 10px 0; font-size: 12px;">${property.description}</p>
        </div>
      `);

      marker.on('click', () => {
        setSelectedProperty(property);
        onSelectResearchBase?.(property.id);
      });
    });

    // Cleanup function
    return () => {
      layersCancelled = true;
      mapRef.current = null;
      mapLayerGroupsRef.current = {};
      map.remove();
    };
  }, [mapLoaded, visibleProperties, activeBoundaryFeature]);

  return (
    <div className="relative bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-full min-h-0 overflow-hidden flex flex-col">
      {/* Map Container */}
      <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-[minmax(0,1fr)] gap-6 flex-1 min-h-0 overflow-hidden">
        <div className="relative md:col-span-2 h-full min-h-0 overflow-hidden">
          <div
            id="map-container"
            className="w-full h-96 md:h-full rounded-lg border border-slate-200 overflow-hidden bg-slate-50"
          />
          <fieldset className="absolute right-3 top-3 z-[500] m-0 rounded-lg border border-slate-200 bg-white/95 p-3 shadow-md backdrop-blur-sm">
            <legend className="px-1 text-xs font-semibold text-slate-700">圖層</legend>
            <div className="space-y-2">
              {mapLayerSources.map(({ id, label, color }) => (
                <label key={id} className="flex cursor-pointer items-center gap-2 text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={enabledMapLayers[id]}
                    onChange={() =>
                      setEnabledMapLayers((current) => ({
                        ...current,
                        [id]: !current[id],
                      }))
                    }
                    className="h-3.5 w-3.5 accent-emerald-600"
                  />
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        {/* Right Panel - Selected Property Details */}
        <div className={`${selectedProperty ? 'flex' : 'hidden md:flex'} flex-col min-h-0`}>
          <div className="bg-slate-50 p-5 rounded-lg border border-slate-200 flex-1 min-h-0 overflow-y-auto">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              {selectedProperty ? '宅院重點摘要' : '選擇宅院'}
              {selectedProperty && (
                <span
                  className="inline-block px-2 py-0.5 rounded-full text-md font-bold text-white"
                  style={{
                    backgroundColor: getScoreLevelColor(selectedProperty.score),
                  }}
                >
                  整建潛力 - {getScoreLevelText(selectedProperty.score)}
                </span>
              )}
            </h3>
            {selectedProperty ? (
              <div className="space-y-4">
                {/* Score */}
                <div>
                  <p className="text-lg text-slate-500 uppercase mb-2">
                    整建分數
                  </p>
                  <span
                    className="inline-block px-3 py-1 rounded-full text-lg font-bold text-white"
                    style={{
                      backgroundColor: getScoreLevelColor(selectedProperty.score),
                    }}
                  >
                    {selectedProperty.score}
                  </span>
                </div>

                {/* Property ID */}
                <div>
                  <p className="text-xs text-slate-500 uppercase">宅院編號</p>
                  <p className="text-sm font-mono text-slate-700">
                    {selectedProperty.id}
                  </p>
                </div>

                {/* Property Name */}
                <div>
                  <p className="text-xs text-slate-500 uppercase">名稱</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {selectedProperty.name}
                  </p>
                </div>

                {/* Price */}
                <div>
                  <p className="text-xs text-slate-500 uppercase">價格</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {formatPrice(selectedProperty.price)}
                  </p>
                </div>

                {/* Description */}
                <div>
                  <p className="text-xs text-slate-500 uppercase">描述</p>
                  <p className="text-sm text-slate-700">
                    {selectedProperty.description}
                  </p>
                </div>

                {/* Coordinates */}
                <div>
                  <p className="text-xs text-slate-500 uppercase">經緯度</p>
                  <p className="text-sm font-mono text-slate-700">
                    {selectedProperty.lat.toFixed(4)}, {selectedProperty.lng.toFixed(4)}
                  </p>
                </div>

                {/* GSV View */}
                <div>
                  <p className="text-xs text-slate-500 uppercase mb-2">
                    GSV檢視
                  </p>
                  <a
                    href={`https://www.google.com/maps?q=${selectedProperty.lat},${selectedProperty.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full bg-slate-900 hover:bg-slate-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-center text-sm"
                  >
                    📍 Google 街景檢視
                  </a>
                </div>

                {/* Case Analysis Link */}
                <Link
                  to={`/cases/${selectedProperty.id}`}
                  className="block w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-center text-sm"
                >
                  📊 查看完整分析報告
                </Link>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-slate-500 text-sm">
                  在地圖上點擊任一標記以檢視宅院詳情
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      {selectedResearchBase !== '全部' && onViewAnalysis && showAnalysisButton && (
        <button
          type="button"
          onClick={onViewAnalysis}
          className="fixed bottom-5 left-1/2 z-[1000] -translate-x-1/2 rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-lg transition-all hover:scale-105 hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2"
          aria-label="捲動至個案分析"
        >
          查看個案分析 ↓
        </button>
      )}
    </div>
  );
};

export default MapBlock;
