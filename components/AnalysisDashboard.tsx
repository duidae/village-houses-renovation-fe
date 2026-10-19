import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, Tooltip, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import type { AnalysisData, AspectAnalysis, ConnectivityOption, PopulationDataPoint, PopulationStructure, ReuseType } from '../types';
import { fetchPublicFacilities, fetchVillageBoundaries, findVillageBoundary, loadLeaflet } from '../services/mapData';
import { ChartBarIcon, DownloadIcon, ExternalLinkIcon, HomeIcon, LightbulbIcon, PuzzleIcon, UsersIcon } from './icons';

interface AnalysisDashboardProps {
  data: AnalysisData;
  id?: string;
}

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

// Aspect analyses mark keywords with **…**; the report shows them as plain text.
const stripMarkup = (text: string) => text.replace(/\*\*/g, '');

const TOOLTIP_STYLE = { backgroundColor: '#f8fafc', borderColor: '#cbd5e1', color: '#0f172a' };

// --- Layout primitives -------------------------------------------------------

const ReportSection: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; className?: string }> = ({ title, icon, children, className = '' }) => (
    <section className={`bg-white rounded-[28px] border border-slate-300 p-4 sm:p-6 ${className}`}>
        <h3 className="flex items-center gap-3 mb-4 text-2xl sm:text-3xl font-bold text-report-olive">
            <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-report-olive text-white">{icon}</span>
            {title}
        </h3>
        {children}
    </section>
);

const SubCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}>{children}</div>
);

const SubHeading: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <h4 className={`flex items-center gap-2 text-lg text-brand-text ${className}`}>
        <span className="h-5 w-1 flex-shrink-0 bg-report-sage-dark" />
        {children}
    </h4>
);

const DataRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <div className="flex items-baseline justify-between gap-4 border-b border-slate-200 py-2 last:border-b-0">
        <span className="flex items-center gap-2 text-brand-text whitespace-nowrap">
            <span className="h-5 w-1 flex-shrink-0 bg-report-sage-dark" />
            {label}
        </span>
        <span className="text-right text-slate-700 break-all">{value}</span>
    </div>
);

const Chip: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <span className={`inline-block rounded-full bg-report-sage px-4 py-1 font-bold text-brand-text whitespace-nowrap ${className}`}>{children}</span>
);

function Tabs<T extends string>({ options, value, onChange }: { options: readonly T[]; value: T; onChange: (value: T) => void }) {
    return (
        <div className="flex flex-wrap gap-2" role="tablist">
            {options.map(option => (
                <button
                    key={option}
                    type="button"
                    role="tab"
                    aria-selected={option === value}
                    onClick={() => onChange(option)}
                    className={`rounded-full border-2 border-report-rust px-4 py-1 font-bold transition-colors ${
                        option === value ? 'bg-report-rust text-white' : 'bg-white text-brand-text hover:bg-report-rust/10'
                    }`}
                >
                    {option}
                </button>
            ))}
        </div>
    );
}

const orNotProvided = (value: string | undefined | null) => (value && value.trim()) || '未提供';

// --- Score gauge -------------------------------------------------------------

const CpiGauge: React.FC<{ score: number }> = ({ score }) => {
    const data = [{ name: 'Score', value: score }, { name: 'Remaining', value: 100 - score }];
    const levelColor = getScoreLevelColor(score);
    const COLORS = [levelColor, '#ececec'];

    return (
        <div>
            <div className="relative mx-auto w-full max-w-xs h-44">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={data} cx="50%" cy="85%" startAngle={180} endAngle={0} innerRadius="95%" outerRadius="150%" dataKey="value" stroke="none" isAnimationActive={false}>
                            {data.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
                <p className="absolute bottom-0 left-1/2 -translate-x-1/2 whitespace-nowrap font-bold" style={{ color: levelColor }}>
                    <span className="text-6xl">{score}</span>
                    <span className="text-lg text-brand-text">/100</span>
                </p>
            </div>
            <p className="mt-3 text-sm text-brand-subtext">說明: 分數越高代表越需要進行整建</p>
        </div>
    );
};

// --- Context maps (區域背景資料) -----------------------------------------------

type ContextMapMode = 'environment' | 'road' | 'transit' | 'facilities';

const MAP_LEGENDS: Record<ContextMapMode, { label: string; swatch: React.ReactNode }[]> = {
    environment: [],
    road: [],
    transit: [{ label: '半徑300m', swatch: <span className="inline-block h-3 w-3 flex-shrink-0 rounded-full border-2 border-dashed border-orange-500" /> }],
    facilities: [
        { label: '迎毗設施', swatch: <span className="inline-block h-3 w-3 flex-shrink-0 rounded-sm bg-[#f5deb3]" /> },
        { label: '鄰避設施', swatch: <span className="inline-block h-3 w-3 flex-shrink-0 rounded-sm bg-red-500" /> },
        { label: '半徑300m', swatch: <span className="inline-block h-3 w-3 flex-shrink-0 rounded-full border-2 border-dashed border-orange-500" /> },
    ],
};

const ContextMap: React.FC<{ lat: number; lng: number; area: string; mode: ContextMapMode }> = ({ lat, lng, area, mode }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let cancelled = false;
        let map: any = null;
        let resizeObserver: ResizeObserver | null = null;

        (async () => {
            const L = await loadLeaflet().catch(() => null);
            if (cancelled || !L || !containerRef.current) return;

            map = L.map(containerRef.current, { zoomControl: true, scrollWheelZoom: false }).setView([lat, lng], 15);
            resizeObserver = new ResizeObserver(() => map?.invalidateSize({ pan: false }));
            resizeObserver.observe(containerRef.current);
            requestAnimationFrame(() => map?.invalidateSize({ pan: false }));
            L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                attribution: 'Tiles © Esri',
                maxZoom: 19,
                crossOrigin: 'anonymous', // lets the PDF export capture the tiles
            }).addTo(map);

            if (mode === 'transit' || mode === 'facilities') {
                const buffer = L.circle([lat, lng], { radius: 300, color: '#f97316', weight: 2, dashArray: '6 6', fill: false }).addTo(map);
                map.fitBounds(buffer.getBounds(), { padding: [12, 12] });
            }

            const boundaries = await fetchVillageBoundaries().catch(() => null);
            if (cancelled) return;
            const boundary = findVillageBoundary(boundaries, area);
            if (boundary) {
                L.geoJSON(boundary, { style: { color: '#facc15', weight: 3, dashArray: '8 6', fill: false } }).addTo(map);
            }

            if (mode === 'facilities') {
                const facilities = await fetchPublicFacilities().catch(() => null);
                if (cancelled) return;
                if (facilities) {
                    L.geoJSON(facilities, {
                        style: (feature: any) => {
                            const color = feature?.properties?.Impact === '鄰避設施' ? '#ef4444' : '#f5deb3';
                            return { color, fillColor: color, weight: 2, fillOpacity: 0.6 };
                        },
                        onEachFeature: (feature: any, layer: any) => {
                            if (feature?.properties?.Name) layer.bindTooltip(feature.properties.Name);
                        },
                    }).addTo(map);
                }
            }

            map.invalidateSize({ pan: false });
            map.setView([lat, lng], map.getZoom(), { animate: false });

            const houseIcon = L.divIcon({
                className: '',
                html: '<div style="display:flex;align-items:center;justify-content:center;width:34px;height:34px;border:3px solid white;border-radius:50%;background:#eab308;box-shadow:0 2px 6px rgba(0,0,0,.45);font-size:19px;line-height:1" title="個宅">🏠</div>',
                iconSize: [34, 34],
                iconAnchor: [17, 17],
            });
            L.marker([lat, lng], { icon: houseIcon, zIndexOffset: 1000 })
                .bindTooltip('個宅')
                .addTo(map);
        })();

        return () => {
            cancelled = true;
            resizeObserver?.disconnect();
            map?.remove();
        };
    }, [lat, lng, area, mode]);

    const legend = [
        { label: '個宅', swatch: <span className="inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-yellow-500 text-[10px] leading-none">🏠</span> },
        ...MAP_LEGENDS[mode],
        { label: '社區範圍', swatch: <span className="inline-block h-3 w-3 flex-shrink-0 border-2 border-dashed border-yellow-400" /> },
    ];

    return (
        <div className="relative h-56 sm:h-64 overflow-hidden rounded-lg bg-slate-200">
            <div ref={containerRef} className="h-full w-full" />
            <ul className="absolute bottom-6 right-2 z-[400] space-y-1 rounded bg-white/90 px-2 py-1.5 text-xs leading-4 text-slate-700 shadow">
                {legend.map(({ label, swatch }) => (
                    <li key={label} className="flex items-center gap-1.5 whitespace-nowrap">{swatch}{label}</li>
                ))}
            </ul>
        </div>
    );
};

const LOCATION_TABS = ['道路系統', '公共運輸站點', '公共服務設施'] as const;
type LocationTab = (typeof LOCATION_TABS)[number];

const LOCATION_TAB_MODES: Record<LocationTab, ContextMapMode> = {
    道路系統: 'road',
    公共運輸站點: 'transit',
    公共服務設施: 'facilities',
};

const describeLocation = (tab: LocationTab, connectivity: ConnectivityOption[]): string => {
    switch (tab) {
        case '道路系統':
            return connectivity.includes('地點佳，主幹道上') ? '個宅位於主幹道上' : '個宅未位於主幹道上';
        case '公共運輸站點':
            return connectivity.includes('交通佳，至最近公共運輸站點的直線距離<=300m')
                ? '個宅至最近公共運輸站點的直線距離 ≤ 300公尺'
                : '個宅周邊300公尺範圍內無公共運輸站點';
        case '公共服務設施':
            return connectivity.includes('有公共設施，方圓半徑300公尺內有迎毗設施')
                ? '周邊300公尺範圍內有迎毗公共設施'
                : '周邊300公尺範圍內無迎毗公共設施';
    }
};

// --- 社會面 -------------------------------------------------------------------

const SOCIAL_TABS = ['人口/戶數', '社區組織運作狀況', '在地產業類型', '地方特色活動與宗教文化'] as const;
type SocialTab = (typeof SOCIAL_TABS)[number];

const CountRow: React.FC<{ label: string; value: number | undefined }> = ({ label, value }) => (
    <div className="flex justify-between border-b border-slate-200 py-2 last:border-b-0">
        <span>{label}</span>
        <span>{value !== undefined ? `${value.toLocaleString()}(人)` : '未提供'}</span>
    </div>
);

const TrendChart: React.FC<{ data: PopulationDataPoint[]; dataKey: 'population' | 'households'; name: string; marker: 'circle' | 'square' }> = ({ data, dataKey, name, marker }) => {
    const sortedData = [...data].sort((a, b) => a.year - b.year);
    const dot = marker === 'square'
        ? ({ cx, cy, index }: any) => <rect key={index} x={cx - 4} y={cy - 4} width={8} height={8} fill="#111827" />
        : { r: 4, fill: '#111827' };
    return (
        <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sortedData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="4 4" stroke="#cbd5e1" />
                    <XAxis dataKey="year" stroke="#475569" />
                    <YAxis stroke="#475569" tickFormatter={(value) => new Intl.NumberFormat('en-US', { notation: 'compact' }).format(value as number)} domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.3)]} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value: number) => [value.toLocaleString(), name]} />
                    <Legend />
                    <Line type="linear" dataKey={dataKey} name={name} stroke="#111827" strokeWidth={2} dot={dot} legendType={marker === 'square' ? 'square' : 'circle'} isAnimationActive={false} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

const PopulationPanel: React.FC<{ data: PopulationDataPoint[]; structure?: PopulationStructure | null }> = ({ data, structure }) => {
    const hasHouseholds = data.some(d => d.households);
    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.4fr_1.4fr]">
            <div className="space-y-3">
                <SubHeading>性別</SubHeading>
                <div className="px-1">
                    <CountRow label="男" value={structure?.male} />
                    <CountRow label="女" value={structure?.female} />
                </div>
                <SubHeading>人口結構</SubHeading>
                <div className="px-1">
                    <CountRow label="幼年(0-14歲)" value={structure?.youth} />
                    <CountRow label="壯年(15-64歲)" value={structure?.workingAge} />
                    <CountRow label="老年(65歲↑)" value={structure?.elderly} />
                </div>
            </div>
            <div>
                <SubHeading className="mb-2">歷年戶數</SubHeading>
                {hasHouseholds ? <TrendChart data={data} dataKey="households" name="戶數" marker="square" /> : <p className="text-brand-subtext">未提供</p>}
            </div>
            <div>
                <SubHeading className="mb-2">歷年人口數</SubHeading>
                {data.length > 0 ? <TrendChart data={data} dataKey="population" name="人口數" marker="circle" /> : <p className="text-brand-subtext">未提供</p>}
            </div>
        </div>
    );
};

const ChipList: React.FC<{ items: string[] }> = ({ items }) =>
    items.length > 0 ? (
        <div className="flex flex-wrap gap-2">
            {items.map(item => <Chip key={item} className="font-medium">{item}</Chip>)}
        </div>
    ) : (
        <p className="text-brand-subtext">未提供</p>
    );

// --- 評估結果 -----------------------------------------------------------------

const ASPECT_LABELS: { key: keyof AspectAnalysis; name: string }[] = [
    { key: 'communityConnection', name: '社區連結' },
    { key: 'historicalValue', name: '歷史價值' },
    { key: 'buildingCondition', name: '建築物狀況' },
    { key: 'courtyardLayout', name: '院落配置' },
];

const AspectAnalysisChart: React.FC<{ data: AspectAnalysis }> = ({ data }) => {
    // Clockwise from top-left, matching the report's square radar.
    const chartData = [
        { subject: '社區連結', score: data.communityConnection.score },
        { subject: '建築物狀況', score: data.buildingCondition.score },
        { subject: '院落配置', score: data.courtyardLayout.score },
        { subject: '歷史價值', score: data.historicalValue.score },
    ];

    return (
        <div className="grid grid-cols-1 items-center gap-4 md:grid-cols-[minmax(0,18rem)_1fr]">
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="65%" startAngle={135} endAngle={-225} data={chartData}>
                        <PolarGrid gridType="polygon" stroke="#cbd5e1" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#a8552f', fontSize: 14 }} />
                        <PolarRadiusAxis domain={[0, 10]} tick={false} axisLine={false} />
                        <Radar name="評分" dataKey="score" stroke="#f0b02b" fill="#f6d9a8" fillOpacity={0.7} dot={{ r: 3, fill: '#f0b02b' }} isAnimationActive={false} />
                        <Tooltip contentStyle={TOOLTIP_STYLE} />
                    </RadarChart>
                </ResponsiveContainer>
            </div>
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3">
                {ASPECT_LABELS.map(({ key, name }) => (
                    <React.Fragment key={key}>
                        <dt className="flex items-center gap-2 text-lg text-brand-text whitespace-nowrap">
                            <span className="h-5 w-1 bg-report-sage-dark" />
                            {name}
                        </dt>
                        <dd className="text-brand-subtext self-center">{stripMarkup(data[key].analysis)}</dd>
                    </React.Fragment>
                ))}
            </dl>
        </div>
    );
};

// --- 再利用類型建議 -------------------------------------------------------------

const REUSE_TYPE_DESCRIPTIONS: Record<ReuseType, string> = {
    '照顧療育服務型': '作為長者關懷據點或照顧服務空間，延續社區共餐、送餐等照護能量。',
    '社區生活共享型': '轉為社區客廳或共享空間，提供居民聚會、交流與志工活動場域。',
    '文化保存展示型': '保存傳統建築特色，作為地方文史展示或文化導覽據點。',
    '地方技藝培育型': '作為手工藝、傳統技藝的教學與傳承工坊。',
    '食農教育體驗型': '結合在地農產，發展食農教育、農事體驗與產地餐桌活動。',
    '產業加工營運型': '作為在地農產品加工、包裝或品牌營運基地。',
    '青年創業共創型': '提供青年返鄉創業、共同工作或微型商業空間。',
    '農遊體驗服務型': '結合休閒農業與觀光資源，作為遊客服務或體驗據點。',
    '社區安全韌性型': '作為防災避難、物資整備或社區巡守據點。',
    '兒少/數位共學服務型': '作為兒少課後陪伴、數位學習與共學空間。',
    '社區健康促進型': '作為健康促進、延緩失能課程與運動保健活動場所。',
};

// One-paragraph summary of the house built from the four aspect scores.
const describeHouse = (aspects: AspectAnalysis): string => {
    const { historicalValue, buildingCondition, courtyardLayout, communityConnection } = aspects;
    const traits = [
        historicalValue.score >= 7 ? '具有歷史文化價值' : historicalValue.score >= 5 ? '具一定的傳統建築特色' : '歷史價值較為有限',
        buildingCondition.score >= 10 ? '建築物狀況良好' : buildingCondition.score >= 7 ? '建築物狀況尚可、部分項目需維護' : '建築物狀況需加強維護管理',
        courtyardLayout.score >= 9 ? '院落空間完整' : courtyardLayout.score >= 5 ? '院落空間具有一定的完整度' : '院落空間較為有限',
        communityConnection.score >= 8 ? '周邊交通與生活機能便利' : communityConnection.score >= 6 ? '周邊交通與生活機能普通' : '周邊交通與生活機能較為不便',
    ];
    const first = buildingCondition.score >= 10 ? '建議可直接規劃活化使用' : '建議先進行簡易整修';
    const next = courtyardLayout.score >= 5 ? '後續可向外發展為戶外活動使用' : '後續以室內活動空間為主';
    return `${traits.join('、')}，因此${first}，${next}。`;
};

// --- PDF export ---------------------------------------------------------------

async function downloadReportPdf(element: HTMLElement, fileName: string) {
    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas'), import('jspdf')]);
    const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        ignoreElements: (node) => (node as HTMLElement).dataset?.pdfIgnore === 'true',
    });

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const margin = 8;
    const imageWidth = pdf.internal.pageSize.getWidth() - margin * 2;
    const pageHeight = pdf.internal.pageSize.getHeight() - margin * 2;
    const pxPerMm = canvas.width / imageWidth;
    const pageHeightPx = Math.floor(pageHeight * pxPerMm);

    // Slice the tall canvas into A4-height pages.
    for (let offset = 0, page = 0; offset < canvas.height; offset += pageHeightPx, page++) {
        const sliceHeight = Math.min(pageHeightPx, canvas.height - offset);
        const slice = document.createElement('canvas');
        slice.width = canvas.width;
        slice.height = sliceHeight;
        slice.getContext('2d')?.drawImage(canvas, 0, offset, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);
        if (page > 0) pdf.addPage();
        pdf.addImage(slice.toDataURL('image/jpeg', 0.92), 'JPEG', margin, margin, imageWidth, sliceHeight / pxPerMm);
    }
    pdf.save(fileName);
}

// --- Dashboard ----------------------------------------------------------------

export const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({ data, id }) => {
  const {
      basicInfo, environmentalAnalysis, potentialIndex, cityPopulation, populationStructure,
      aspectAnalysis, reuseTypes, connectivity = [],
  } = data;
  const [locationTab, setLocationTab] = useState<LocationTab>('道路系統');
  const [socialTab, setSocialTab] = useState<SocialTab>('人口/戶數');
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const houseId = basicInfo.houseId || basicInfo.name;
  const score = potentialIndex.cpiScore;
  const levelColor = getScoreLevelColor(score);
  const area = `${basicInfo.county ?? ''}${basicInfo.township ?? ''}${basicInfo.village ?? ''}`;
  const location = [basicInfo.county, basicInfo.township, basicInfo.village].filter(Boolean).join('/');
  const subtitle = basicInfo.county ? `${basicInfo.county}${basicInfo.township ?? ''} ${basicInfo.community ?? ''}` : basicInfo.address;
  const streetViewUrl = basicInfo.streetViewUrl
    || `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${basicInfo.latitude},${basicInfo.longitude}`;
  const landParcel = [basicInfo.landSection, basicInfo.landNumber].filter(Boolean).join('');

  const handleDownload = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    try {
      await downloadReportPdf(reportRef.current, `整建潛力診斷報告-${houseId}.pdf`);
    } catch (error) {
      console.error('Unable to export PDF:', error);
      alert('PDF 匯出失敗，請稍後再試。');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div id={id} ref={reportRef} className="space-y-4 animate-fade-in bg-white">
        {/* Title bar */}
        <header className="flex items-center justify-between gap-4 rounded-3xl sm:rounded-full bg-report-olive px-5 sm:px-6 py-3 sm:py-4 text-white">
            <h2 className="text-xl sm:text-4xl font-bold tracking-wide">整建潛力診斷報告</h2>
            <button
                type="button"
                data-pdf-ignore="true"
                onClick={handleDownload}
                disabled={isExporting}
                className="flex items-center gap-2 whitespace-nowrap text-lg hover:opacity-80 disabled:opacity-50"
            >
                <DownloadIcon className="h-6 w-6" />
                {isExporting ? '匯出中…' : '下載PDF'}
            </button>
        </header>

        <nav aria-label="breadcrumb" className="flex items-center gap-2 px-2 text-lg text-brand-text">
            <HomeIcon className="h-6 w-6" />
            <Link to="/" className="hover:underline">首頁</Link>
            <span>/</span>
            <Link to="/" className="hover:underline">GIS平台</Link>
            <span>/</span>
            <span>單棟診斷</span>
        </nav>

        {/* Summary */}
        <section className="grid grid-cols-1 items-center gap-6 rounded-[28px] border border-slate-300 bg-white p-5 sm:p-6 lg:grid-cols-[auto_auto_auto_1fr] lg:divide-x lg:divide-slate-200">
            <div className="space-y-2 lg:pr-6">
                <p className="text-3xl sm:text-4xl font-bold text-report-rust">{houseId}</p>
                <p className="text-xl sm:text-2xl font-bold text-brand-text">{subtitle}</p>
                <div className="flex flex-wrap gap-2">
                    {basicInfo.isInKeyArea && <Chip>重點區內</Chip>}
                    {basicInfo.isRuralRevitalizationCommunity && <Chip>農村再生社區</Chip>}
                </div>
            </div>
            <div className="lg:px-6">
                <p className="rounded-3xl px-8 py-4 text-center text-3xl sm:text-4xl font-bold text-white whitespace-nowrap" style={{ backgroundColor: levelColor }}>
                    整建潛力：{getScoreLevelText(score)}
                </p>
            </div>
            <div className="lg:px-6">
                <p className="text-lg font-bold text-brand-text">整建分數</p>
                <p className="font-bold whitespace-nowrap" style={{ color: levelColor }}>
                    <span className="text-6xl">{score}</span>
                    <span className="text-lg text-brand-text">/100</span>
                </p>
            </div>
            <div className="lg:pl-6">
                <p className="mb-2 text-lg font-bold text-brand-text">建議再利用類型</p>
                <div className="flex flex-wrap gap-2">
                    {reuseTypes.length > 0 ? reuseTypes.map(type => <Chip key={type}>{type}</Chip>) : <span className="text-brand-subtext">未提供</span>}
                </div>
            </div>
        </section>

        {/* 基本資料 + 建築與土地 */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[2fr_3fr]">
            <ReportSection title="基本資料與政策條件" icon={<HomeIcon className="h-6 w-6" />}>
                <SubCard>
                    <DataRow label="宅院ID/編號" value={houseId} />
                    <DataRow label="座標" value={`${basicInfo.latitude.toFixed(6)}, ${basicInfo.longitude.toFixed(6)}`} />
                    <DataRow label="所在地" value={orNotProvided(location)} />
                    <DataRow label="所在社區" value={orNotProvided(basicInfo.community)} />
                    <DataRow label="是否位在農村發展重點區" value={basicInfo.isInKeyArea ? '是' : '否'} />
                    <DataRow label="是否為農村再生社區" value={basicInfo.isRuralRevitalizationCommunity ? '是' : '否'} />
                    <DataRow label="執行署內相關計畫" value={orNotProvided(basicInfo.relatedPlans)} />
                </SubCard>
            </ReportSection>

            <ReportSection title="建築與土地資料" icon={<PuzzleIcon className="h-6 w-6" />}>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-4">
                        <SubCard>
                            <h4 className="mb-1 text-xl font-bold text-brand-text">建築資料</h4>
                            <DataRow label="樓層數" value={basicInfo.floorCount ? `${basicInfo.floorCount}(層樓)` : '未提供'} />
                            <DataRow label="身分屬性" value={basicInfo.isHeritage ? '具文資身分' : '一般'} />
                            <DataRow label="建築形態" value={orNotProvided(basicInfo.buildingType)} />
                        </SubCard>
                        <div>
                            <h4 className="mb-2 text-xl font-bold text-brand-text">GSV街景預覽</h4>
                            <a
                                href={streetViewUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 rounded-2xl bg-report-sage px-5 py-3 text-lg text-brand-text hover:brightness-95"
                            >
                                開啟街景
                                <ExternalLinkIcon className="h-6 w-6" />
                            </a>
                        </div>
                    </div>
                    <SubCard>
                        <h4 className="mb-1 text-xl font-bold text-brand-text">土地資料</h4>
                        <DataRow label="地段/地號" value={orNotProvided(landParcel)} />
                        <DataRow label="土地面積" value={orNotProvided(basicInfo.landArea)} />
                        <DataRow label="土地使用分區" value={orNotProvided(basicInfo.landUseZone)} />
                        <DataRow label="土地使用類別" value={orNotProvided(basicInfo.landUseCategory)} />
                        <DataRow label="國土功能分區" value={orNotProvided(basicInfo.landFunctionZone)} />
                    </SubCard>
                </div>
            </ReportSection>
        </div>

        {/* 區域背景資料 */}
        <ReportSection title="區域背景資料" icon={<UsersIcon className="h-6 w-6" />}>
            <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_3fr]">
                    <SubCard className="space-y-3">
                        <h4 className="text-xl font-bold text-brand-text">環境面</h4>
                        <ContextMap lat={basicInfo.latitude} lng={basicInfo.longitude} area={area} mode="environment" />
                        <p className="text-brand-text">{basicInfo.environmentalSensitivity || '環境敏感條件資料尚未提供'}</p>
                    </SubCard>
                    <SubCard className="space-y-3">
                        <div className="flex flex-wrap items-center gap-3">
                            <h4 className="text-xl font-bold text-brand-text">區位與生活機能面</h4>
                            <Tabs<LocationTab> options={LOCATION_TABS} value={locationTab} onChange={setLocationTab} />
                        </div>
                        <ContextMap lat={basicInfo.latitude} lng={basicInfo.longitude} area={area} mode={LOCATION_TAB_MODES[locationTab]} />
                        <p className="text-brand-text">
                            {describeLocation(locationTab, connectivity)}
                            <span className="ml-2 text-xs text-slate-400">（推估）</span>
                        </p>
                    </SubCard>
                </div>

                <SubCard className="space-y-4">
                    <h4 className="text-xl font-bold text-brand-text">社會面</h4>
                    <Tabs<SocialTab> options={SOCIAL_TABS} value={socialTab} onChange={setSocialTab} />
                    {socialTab === '人口/戶數' && <PopulationPanel data={cityPopulation} structure={populationStructure} />}
                    {socialTab === '社區組織運作狀況' && (
                        <p className="leading-relaxed text-brand-text">{orNotProvided(basicInfo.communityOrgStatus)}</p>
                    )}
                    {socialTab === '在地產業類型' && <ChipList items={environmentalAnalysis.localSpecialtyFoods ?? []} />}
                    {socialTab === '地方特色活動與宗教文化' && <ChipList items={environmentalAnalysis.localAttractions ?? []} />}
                    <p className="text-xs text-slate-400">人口資料來源：中華民國內政部戶政司</p>
                </SubCard>
            </div>
        </ReportSection>

        {/* 評估結果 */}
        <ReportSection title="評估結果" icon={<ChartBarIcon className="h-6 w-6" />}>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_2.5fr] lg:divide-x lg:divide-slate-200">
                <div>
                    <SubHeading className="mb-4">整建潛能分數</SubHeading>
                    <CpiGauge score={score} />
                </div>
                <div className="lg:pl-6">
                    <SubHeading className="mb-2">四大面向分析</SubHeading>
                    <AspectAnalysisChart data={aspectAnalysis} />
                </div>
            </div>
        </ReportSection>

        {/* 再利用類型建議 */}
        <ReportSection title="再利用類型建議" icon={<LightbulbIcon className="h-6 w-6" />}>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_2fr] lg:divide-x lg:divide-slate-200">
                <div>
                    <SubHeading className="mb-3">宅院特性</SubHeading>
                    <p className="leading-relaxed text-brand-subtext px-3">{describeHouse(aspectAnalysis)}</p>
                </div>
                <div className="lg:pl-6">
                    <SubHeading className="mb-3">再利用類型</SubHeading>
                    <ul className="space-y-3 px-3">
                        {reuseTypes.map(type => (
                            <li key={type} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                                <Chip className="text-lg">{type}</Chip>
                                <span className="text-brand-subtext">{REUSE_TYPE_DESCRIPTIONS[type]}</span>
                            </li>
                        ))}
                    </ul>
                    <p className="mt-3 px-3 text-xs text-slate-400">依建築型態、在地產業、地方文化與社區組織運作狀況推估，僅供參考。</p>
                </div>
            </div>
        </ReportSection>
    </div>
  );
};
