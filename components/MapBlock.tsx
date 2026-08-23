import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { PropertyMarker } from '../mocks/properties';
import { fetchProperties } from '../services/propertiesService';

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

const MapBlock: React.FC = () => {
  const [selectedProperty, setSelectedProperty] = useState<PropertyMarker | null>(
    null
  );
  const [properties, setProperties] = useState<PropertyMarker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  React.useEffect(() => {
    fetchProperties().then(setProperties);
  }, []);

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
    const map = L.map('map-container').setView([23.4789, 120.447], 15);

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Add markers for each property
    properties.forEach((property) => {
      const statusColor = {
        planning: '#fbbf24', // amber
        'in-progress': '#60a5fa', // blue
        completed: '#4ade80', // green
      }[property.renovationStatus];
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
          ">
            ${isHighScore ? '🔥 ' : ''}${formatPrice(property.price)} · 分數 ${property.score}
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
          <span style="display: inline-block; padding: 4px 8px; border-radius: 4px; background-color: ${statusColor}; color: white; font-size: 11px; font-weight: bold;">
            ${getStatusText(property.renovationStatus)}
          </span>
        </div>
      `);

      marker.on('click', () => {
        setSelectedProperty(property);
      });
    });

    // Cleanup function
    return () => {
      map.remove();
    };
  }, [mapLoaded, properties]);

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      planning: '規劃中',
      'in-progress': '施工中',
      completed: '已完成',
    };
    return statusMap[status] || status;
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mt-2 h-full flex flex-col">
      {/* Map Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        <div className="lg:col-span-2 h-full">
          <div
            id="map-container"
            className="w-full h-96 lg:h-full rounded-lg border border-slate-200 overflow-hidden bg-slate-50"
          />
        </div>

        {/* Right Panel - Selected Property Details */}
        <div className="flex flex-col">
          <div className="bg-slate-50 p-5 rounded-lg border border-slate-200 flex-1 overflow-y-auto">
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

                

                {/* Status */}
                <div>
                  <p className="text-xs text-slate-500 uppercase mb-2">
                    整建進度
                  </p>
                  <span
                    className="inline-block px-3 py-1 rounded-full text-xs font-bold text-white"
                    style={{
                      backgroundColor: {
                        planning: '#fbbf24',
                        'in-progress': '#60a5fa',
                        completed: '#4ade80',
                      }[selectedProperty.renovationStatus],
                    }}
                  >
                    {getStatusText(selectedProperty.renovationStatus)}
                  </span>
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
    </div>
  );
};

export default MapBlock;
