import React, { useState } from 'react';

interface PropertyMarker {
  id: string;
  name: string;
  lat: number;
  lng: number;
  description: string;
  streetViewUrl?: string;
  renovationStatus: 'planning' | 'in-progress' | 'completed';
}

const sampleProperties: PropertyMarker[] = [
  {
    id: 'prop-1',
    name: '嘉義好宅1 - 文化傳承宅',
    lat: 23.4789,
    lng: 120.4470,
    description: '木造老屋，保留傳統建築特色，規劃文化展示空間',
    renovationStatus: 'planning',
  },
  {
    id: 'prop-2',
    name: '嘉義好宅2 - 生態永續宅',
    lat: 23.4799,
    lng: 120.4480,
    description: '導入生態理念，設置太陽能、雨水回收系統',
    renovationStatus: 'in-progress',
  },
  {
    id: 'prop-3',
    name: '嘉義好宅3 - 樂齡友善宅',
    lat: 23.4809,
    lng: 120.4490,
    description: '無障礙空間改造，適合銀髮族居住',
    renovationStatus: 'completed',
  },
  {
    id: 'prop-4',
    name: '嘉義好宅4 - 青創基地宅',
    lat: 23.4779,
    lng: 120.4460,
    description: '改造為青年創業空間，結合居住與工作功能',
    renovationStatus: 'planning',
  },
];

const MapBlock: React.FC = () => {
  const [selectedProperty, setSelectedProperty] = useState<PropertyMarker | null>(
    null
  );
  const [mapLoaded, setMapLoaded] = useState(false);

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
    sampleProperties.forEach((property) => {
      const statusColor = {
        planning: '#fbbf24', // amber
        'in-progress': '#60a5fa', // blue
        completed: '#4ade80', // green
      }[property.renovationStatus];

      // Create custom marker HTML
      const markerHtml = `
        <div style="
          background-color: ${statusColor};
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          cursor: pointer;
          font-weight: bold;
          color: white;
          font-size: 16px;
        ">
          🏠
        </div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        iconSize: [30, 30],
        popupAnchor: [0, -15],
      });

      const marker = L.marker([property.lat, property.lng], {
        icon: customIcon,
      }).addTo(map);

      marker.bindPopup(`
        <div style="font-family: sans-serif; color: #333;">
          <h3 style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold;">${property.name}</h3>
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
  }, [mapLoaded]);

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      planning: '規劃中',
      'in-progress': '施工中',
      completed: '已完成',
    };
    return statusMap[status] || status;
  };

  return (
    <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800 mt-10">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-brand-text mb-2 flex items-center">
          🗺️ 村落整建地圖
        </h2>
        <p className="text-brand-subtext">互動式地圖展示參與整建計畫的農村宅院</p>
      </div>

      {/* Map Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div
            id="map-container"
            className="w-full h-96 lg:h-full rounded-lg border border-zinc-700 overflow-hidden"
            style={{ minHeight: '500px' }}
          />
        </div>

        {/* Right Panel - Selected Property Details */}
        <div className="flex flex-col">
          <div className="bg-zinc-800/70 p-5 rounded-lg border border-zinc-700 flex-1 overflow-y-auto">
            <h3 className="text-lg font-semibold text-brand-text mb-4">
              {selectedProperty ? '宅院詳情' : '選擇宅院'}
            </h3>

            {selectedProperty ? (
              <div className="space-y-4">
                {/* Property Name */}
                <div>
                  <p className="text-xs text-brand-subtext uppercase">名稱</p>
                  <p className="text-sm font-semibold text-brand-text">
                    {selectedProperty.name}
                  </p>
                </div>

                {/* Description */}
                <div>
                  <p className="text-xs text-brand-subtext uppercase">描述</p>
                  <p className="text-sm text-brand-text/90">
                    {selectedProperty.description}
                  </p>
                </div>

                {/* Coordinates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-brand-subtext uppercase">緯度</p>
                    <p className="text-sm font-mono text-brand-accent">
                      {selectedProperty.lat.toFixed(4)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-brand-subtext uppercase">經度</p>
                    <p className="text-sm font-mono text-brand-accent">
                      {selectedProperty.lng.toFixed(4)}
                    </p>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <p className="text-xs text-brand-subtext uppercase mb-2">
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

                {/* Street View Link */}
                <a
                  href={`https://www.google.com/maps?q=${selectedProperty.lat},${selectedProperty.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 w-full bg-brand-accent hover:bg-teal-300 text-brand-dark font-semibold py-2 px-4 rounded-lg transition-colors text-center text-sm"
                >
                  📍 Google 街景檢視
                </a>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-brand-subtext text-sm">
                  在地圖上點擊任一標記以檢視宅院詳情
                </p>
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="mt-4 bg-zinc-800/70 p-4 rounded-lg border border-zinc-700">
            <p className="text-xs font-semibold text-brand-text mb-3 uppercase">
              進度圖例
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: '#fbbf24' }}
                />
                <span className="text-xs text-brand-text/80">規劃中</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: '#60a5fa' }}
                />
                <span className="text-xs text-brand-text/80">施工中</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: '#4ade80' }}
                />
                <span className="text-xs text-brand-text/80">已完成</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapBlock;
