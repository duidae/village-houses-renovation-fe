import React, { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import shp from 'shpjs';
import type { PropertyMarker } from '../mocks/properties';
import { fetchProperties } from '../services/propertiesService';
import { researchAreaLabel } from '../services/villageHousesService';
import { DEFAULT_FILTERS, hasActiveCriteria, matchesFilters } from '../services/houseFilters';
import type { HouseFilters } from '../types';
import { ExternalLinkIcon, LeafIcon, MapPinIcon } from './icons';

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
    labelField: 'Name',
  },
  {
    id: 'public-facilities-geojson',
    label: '交通設施',
    url: '/transportation.geojson',
    color: '#9333ea',
    type: 'geojson' as const,
  },
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

const VILLAGE_BOUNDARIES_URL = '/village-boundaries.geojson';

// Feature name labels are hidden below this zoom so they don't clutter the
// county-level overview.
const LAYER_LABEL_MIN_ZOOM = 14;

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);

// The government boundary data uses 臺 (traditional) while our data sometimes
// uses 台 (common variant) for 台中/台南/台北/台東 etc.
const normalizeAreaText = (value: string) => value.replace(/台/g, '臺');

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
  filters?: HouseFilters;
  onSelectHouse?: (houseId: string) => void;
  onViewAnalysis?: () => void;
  showAnalysisButton?: boolean;
}

const MapBlock: React.FC<MapBlockProps> = ({
  filters = DEFAULT_FILTERS,
  onSelectHouse,
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
  const enabledLayerCount = Object.values(enabledMapLayers).filter(Boolean).length;
  // The layer panel covers most of the map on phones, so it starts collapsed
  // below the md breakpoint.
  const [isLayerPanelOpen, setIsLayerPanelOpen] = useState(
    () => typeof window === 'undefined' || window.matchMedia('(min-width: 768px)').matches
  );
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
    if (filters.houseId !== '全部') {
      return properties.filter((property) => property.id === filters.houseId);
    }
    return properties.filter((property) => matchesFilters(property, filters));
  }, [properties, filters]);
  const isFiltered = hasActiveCriteria(filters);

  // The area a boundary should be drawn for: the 研究基地 filter, or else the
  // selected house's own village.
  const activeResearchArea = useMemo(() => {
    if (filters.area !== '全部') return filters.area;
    const selectedHouse = properties.find((property) => property.id === filters.houseId);
    return selectedHouse ? researchAreaLabel(selectedHouse) : null;
  }, [properties, filters.area, filters.houseId]);

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
  }, [visibleProperties]);

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

    const updateLabelVisibility = () => {
      mapContainer.classList.toggle('map-labels-hidden', map.getZoom() < LAYER_LABEL_MIN_ZOOM);
    };
    updateLabelVisibility();
    map.on('zoomend', updateLabelVisibility);

    let layersCancelled = false;

    const loadShapeLayers = async () => {
      await Promise.all(
        mapLayerSources.map(async ({ id, url, color, type, ...source }) => {
          const labelField = 'labelField' in source ? source.labelField : undefined;
          const categoryField = 'categoryField' in source ? source.categoryField : undefined;
          const categoryColors = 'categoryColors' in source ? source.categoryColors : undefined;
          const weight = 'weight' in source ? source.weight : 2;
          try {
            const geoJson = type === 'geojson' ? await fetch(url).then((res) => res.json()) : await shp(url);
            if (layersCancelled) return;

            const layer = L.geoJSON(geoJson, {
              style: (feature: { properties?: Record<string, unknown> }) => {
                const category = categoryField ? feature?.properties?.[categoryField] : undefined;
                const featureColor = (typeof category === 'string' && categoryColors?.[category]) || color;
                return {
                  color: featureColor,
                  fillColor: featureColor,
                  fillOpacity: categoryColors ? 0.35 : 0.12,
                  opacity: 0.8,
                  weight,
                };
              },
              pointToLayer: (_feature: unknown, latLng: unknown) =>
                L.circleMarker(latLng, {
                  radius: 5,
                  color,
                  fillColor: '#ffffff',
                  fillOpacity: 0.9,
                  weight: 2,
                }),
              onEachFeature: (feature: { properties?: Record<string, unknown> }, featureLayer: any) => {
                const name = labelField ? feature.properties?.[labelField] : undefined;
                if (typeof name !== 'string' || !name.trim()) return;
                featureLayer.bindTooltip(escapeHtml(name.trim()), {
                  permanent: true,
                  direction: 'center',
                  className: 'map-feature-label',
                });
              },
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
            ${property.name}<br/>分數 ${property.score}
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
          <p style="margin: 0 0 10px 0; font-size: 12px;">${property.description}</p>
        </div>
      `);

      marker.on('click', () => {
        setSelectedProperty(property);
        onSelectHouse?.(property.id);
      });
    });

    // With criteria applied but no village boundary to frame, zoom to the
    // matching houses instead of the default overview.
    if (isFiltered && !activeBoundaryFeature && visibleProperties.length > 1) {
      map.fitBounds(
        visibleProperties.map((property) => [property.lat, property.lng]),
        { padding: [48, 48], maxZoom: 16 }
      );
    }

    // Cleanup function
    return () => {
      layersCancelled = true;
      mapRef.current = null;
      mapLayerGroupsRef.current = {};
      map.remove();
    };
  }, [mapLoaded, visibleProperties, activeBoundaryFeature, isFiltered]);

  return (
    <div className="relative bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-full min-h-0 overflow-hidden flex flex-col">
      {/* Map Container */}
      <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-[minmax(0,1fr)] gap-6 flex-1 min-h-0 overflow-hidden">
        <div className="relative md:col-span-2 h-full min-h-0 overflow-hidden">
          <div
            id="map-container"
            className="w-full h-96 md:h-full rounded-lg border border-slate-200 overflow-hidden bg-slate-50"
          />
          <div className="absolute right-3 top-3 z-[500] rounded-lg border border-slate-200 bg-white/95 shadow-md backdrop-blur-sm">
            <button
              type="button"
              onClick={() => setIsLayerPanelOpen((open) => !open)}
              aria-expanded={isLayerPanelOpen}
              aria-controls="map-layer-panel"
              className="flex w-full items-center justify-between gap-2 px-3 py-2 text-xs font-semibold text-slate-700"
            >
              <span className="flex items-center gap-1.5">
                圖層
                {!isLayerPanelOpen && enabledLayerCount > 0 && (
                  <span className="rounded-full bg-emerald-600 px-1.5 text-[10px] leading-4 text-white">{enabledLayerCount}</span>
                )}
              </span>
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
                className={`h-3.5 w-3.5 transition-transform ${isLayerPanelOpen ? 'rotate-180' : ''}`}
              >
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z" clipRule="evenodd" />
              </svg>
            </button>
            {isLayerPanelOpen && (
            <fieldset id="map-layer-panel" className="m-0 border-0 px-3 pb-3 pt-0">
              <legend className="sr-only">圖層</legend>
              <div className="space-y-2">
                {mapLayerSources.map(({ id, label, color, ...source }) => {
                  const categoryColors = 'categoryColors' in source ? source.categoryColors : undefined;
                  return (
                    <div key={id}>
                      <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-700">
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
                      {categoryColors && enabledMapLayers[id] && (
                        <div className="ml-6 mt-1 flex max-w-[11rem] flex-wrap gap-x-2 gap-y-0.5">
                          {Object.entries(categoryColors).map(([category, categoryColor]) => (
                            <span key={category} className="flex items-center gap-1 text-[10px] text-slate-600">
                              <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: categoryColor }} />
                              {category}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </fieldset>
            )}
          </div>
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
                    整建潛能分數
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

                {/* Policy designations */}
                {(selectedProperty.isInKeyArea || selectedProperty.isRuralRevitalizationCommunity) && (
                  <div className="flex flex-wrap gap-2">
                    {selectedProperty.isInKeyArea && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-2.5 py-1 text-xs font-semibold text-teal-800">
                        <MapPinIcon className="h-4 w-4" />
                        重點區內
                      </span>
                    )}
                    {selectedProperty.isRuralRevitalizationCommunity && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-lime-100 px-2.5 py-1 text-xs font-semibold text-lime-800">
                        <LeafIcon className="h-4 w-4" />
                        農村再生社區
                      </span>
                    )}
                  </div>
                )}

                {/* Suggested reuse types */}
                {selectedProperty.reuseSuggestion.primary.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-500 uppercase mb-1">主要建議再利用類型</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedProperty.reuseSuggestion.primary.map((type) => (
                        <span key={type} className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {selectedProperty.reuseSuggestion.other.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-500 uppercase mb-1">其他適合方向</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedProperty.reuseSuggestion.other.map((type) => (
                        <span key={type} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

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
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-center text-sm"
                >
                  📊 查看完整分析報告
                  <ExternalLinkIcon className="h-4 w-4" />
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
      {filters.houseId !== '全部' && onViewAnalysis && showAnalysisButton && (
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
