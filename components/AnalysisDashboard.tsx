

import React, { FC, useEffect, useState } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { AnalysisData, PopulationDataPoint, PopulationStructure, SchoolEnrollmentDataPoint, AspectAnalysis, ReuseType } from '../types';
import { BuildingIcon, MountainIcon, HistoryIcon, UsersIcon, TrendingUpIcon, ShieldIcon, MapPinIcon, SparklesIcon, BuildingOffice2Icon, LeafIcon, UserGroupIcon, ClipboardListIcon, ListBulletIcon, AreaIcon, GlobeIcon, ChartBarIcon, LightbulbIcon } from './icons';

const LABEL_STYLE = 'bg-teal-500/10 text-teal-700 ring-1 ring-teal-500/20';
const UNDERLINE_STYLE = 'no-underline border-b-2 border-teal-500/50 font-medium text-teal-700';


const HighlightedText: React.FC<{ text: string | undefined | null; styleType?: 'label' | 'underline'; customLabelClass?: string }> = ({ text, styleType = 'underline', customLabelClass }) => {
  if (!text) return null;
  const regex = /(\*\*.*?\*\*)/g;

  const getStyleClass = () => {
    if (styleType === 'label') {
        return `px-1.5 py-0.5 rounded-md font-medium ${customLabelClass || LABEL_STYLE}`;
    }
    return UNDERLINE_STYLE;
  };

  return (
    <>
      {text.split(regex).map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          const keyword = part.slice(2, -2);
          return (
            <span key={index} className={getStyleClass()}>
              {keyword}
            </span>
          );
        }
        return part;
      })}
    </>
  );
};


interface AnalysisDashboardProps {
  data: AnalysisData;
  id?: string;
  hideMap?: boolean;
}

const InfoItem: React.FC<{ icon: React.ReactNode; label: string; value: string | number; unit?: string }> = ({ icon, label, value, unit }) => (
  <div className="flex items-center space-x-4">
    <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-teal-500/10 rounded-lg text-brand-accent">
      {icon}
    </div>
    <div>
      <p className="text-sm text-brand-subtext">{label}</p>
      <p className="text-lg font-bold text-brand-text">
        {value} <span className="text-sm font-normal text-brand-subtext">{unit}</span>
      </p>
    </div>
  </div>
);

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

const CpiGauge: React.FC<{ score: number }> = ({ score }) => {
    const data = [ { name: 'Score', value: score }, { name: 'Remaining', value: 100 - score }, ];
    const levelColor = getScoreLevelColor(score);
    const COLORS = [levelColor, '#e2e8f0']; // level color, slate-200

    return (
        <div>
            <div className="relative w-full h-40 ">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={data} cx="50%" cy="50%" startAngle={180} endAngle={0} innerRadius="70%" outerRadius="100%" fill="#8884d8" paddingAngle={2} dataKey="value" stroke="none">
                            {data.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                        </Pie>
                        <Tooltip formatter={(value: number) => [`${value}`, '整建潛能分數']} contentStyle={{ backgroundColor: '#f8fafc', borderColor: '#cbd5e1', color: '#0f172a' }}/>
                    </PieChart>
                </ResponsiveContainer>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/3 text-center">
                    <p className="text-4xl sm:text-5xl font-bold" style={{ color: levelColor }}>{score}</p>
                    <p className="text-sm text-brand-subtext">整建潛能分數</p>
                    <span
                        className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-bold text-white"
                        style={{ backgroundColor: levelColor }}
                    >
                        整建潛力 - {getScoreLevelText(score)}
                    </span>
                </div>
            </div>
            <p className="mt-2 text-xs text-brand-subtext text-center">說明: 分數越高代表越需要進行整建</p>
        </div>
    );
};

const CpiGaugeLegend: React.FC = () => {
    const levels = [
        { label: '高', range: '80 分以上', color: getScoreLevelColor(80) },
        { label: '中', range: '60 - 79 分', color: getScoreLevelColor(60) },
        { label: '低', range: '60 分以下', color: getScoreLevelColor(0) },
    ];
    return (
        <div className="flex justify-center flex-wrap gap-x-4 gap-y-1 mt-2">
            {levels.map((level) => (
                <div key={level.label} className="flex items-center gap-1.5 text-xs text-brand-subtext">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: level.color }} />
                    <span className="font-semibold" style={{ color: level.color }}>{level.label}</span>
                    <span>{level.range}</span>
                </div>
            ))}
        </div>
    );
};

const compactNumber = (value: number) => new Intl.NumberFormat('en-US', { notation: 'compact', compactDisplay: 'short' }).format(value);

const PopulationChart: React.FC<{ data: PopulationDataPoint[] }> = ({ data }) => {
    const sortedData = [...data].sort((a, b) => a.year - b.year);
    const hasHouseholds = sortedData.some(d => d.households);
    return (
        <div className="w-full h-80 bg-slate-50 p-4 rounded-lg border border-slate-200 shadow-sm">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sortedData} margin={{ top: 5, right: hasHouseholds ? 10 : 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                    <XAxis dataKey="year" stroke="#475569" />
                    <YAxis yAxisId="population" stroke="#14b8a6" tickFormatter={(value) => compactNumber(value as number)} domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.1)]} />
                    {hasHouseholds && (
                        <YAxis yAxisId="households" orientation="right" stroke="#6366f1" tickFormatter={(value) => compactNumber(value as number)} domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.1)]} />
                    )}
                    <Tooltip contentStyle={{ backgroundColor: '#f8fafc', borderColor: '#cbd5e1', color: '#0f172a' }} formatter={(value: number, name: string) => [value.toLocaleString(), name]} />
                    <Legend wrapperStyle={{ color: '#475569' }} />
                    <Line yAxisId="population" type="monotone" dataKey="population" stroke="#14b8a6" strokeWidth={2} activeDot={{ r: 8 }} name="人口數" />
                    {hasHouseholds && (
                        <Line yAxisId="households" type="monotone" dataKey="households" stroke="#6366f1" strokeWidth={2} activeDot={{ r: 8 }} name="戶數" />
                    )}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

const BreakdownDonut: React.FC<{ title: string; items: { name: string; value: number; color: string }[] }> = ({ title, items }) => {
    const total = items.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) return null;
    return (
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 shadow-sm">
            <h4 className="font-semibold text-brand-text text-center mb-2">{title}</h4>
            <div className="relative w-full h-44">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={items} dataKey="value" nameKey="name" innerRadius="60%" outerRadius="90%" paddingAngle={2} stroke="none">
                            {items.map(item => <Cell key={item.name} fill={item.color} />)}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#f8fafc', borderColor: '#cbd5e1', color: '#0f172a' }} formatter={(value: number, name: string) => [`${value.toLocaleString()} 人 (${((value / total) * 100).toFixed(1)}%)`, name]} />
                    </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-lg font-bold text-brand-text">{total.toLocaleString()}</p>
                    <p className="text-xs text-brand-subtext">總人口</p>
                </div>
            </div>
            <ul className="mt-3 space-y-1">
                {items.map(item => (
                    <li key={item.name} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-brand-subtext">
                            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                            {item.name}
                        </span>
                        <span className="font-medium text-brand-text">
                            {item.value.toLocaleString()} 人 <span className="text-brand-subtext font-normal">({((item.value / total) * 100).toFixed(1)}%)</span>
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const PopulationSummary: React.FC<{ data: PopulationDataPoint[]; structure?: PopulationStructure | null }> = ({ data, structure }) => {
    const latest = [...data].sort((a, b) => b.year - a.year)[0];
    return (
        <div className="space-y-4 mb-4">
            {latest && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <InfoItem icon={<UsersIcon className="w-6 h-6"/>} label={`人口數 (${latest.year})`} value={latest.population.toLocaleString()} unit="人" />
                    <InfoItem icon={<BuildingIcon className="w-6 h-6"/>} label={`戶數 (${latest.year})`} value={latest.households ? latest.households.toLocaleString() : '未提供'} unit={latest.households ? '戶' : undefined} />
                    <InfoItem icon={<UserGroupIcon className="w-6 h-6"/>} label="平均每戶人數" value={latest.households ? (latest.population / latest.households).toFixed(2) : '未提供'} unit={latest.households ? '人/戶' : undefined} />
                </div>
            )}
            {structure && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <BreakdownDonut title="性別" items={[
                        { name: '男', value: structure.male, color: '#0ea5e9' },
                        { name: '女', value: structure.female, color: '#f43f5e' },
                    ]} />
                    <BreakdownDonut title="年齡結構" items={[
                        { name: '幼年人口 (0-14歲)', value: structure.youth, color: '#22c55e' },
                        { name: '青壯年人口 (15-64歲)', value: structure.workingAge, color: '#14b8a6' },
                        { name: '老年人口 (65歲以上)', value: structure.elderly, color: '#f59e0b' },
                    ]} />
                </div>
            )}
        </div>
    );
};

const SchoolEnrollmentChart: React.FC<{ data: SchoolEnrollmentDataPoint[] }> = ({ data }) => {
    const sortedData = [...data].sort((a, b) => a.year - b.year);
    return (
        <div className="w-full h-80 bg-slate-50 p-4 rounded-lg border border-slate-200 shadow-sm">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sortedData} margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                    <XAxis dataKey="year" stroke="#475569" />
                    <YAxis stroke="#475569" tickFormatter={(value) => new Intl.NumberFormat('en-US', { notation: 'compact', compactDisplay: 'short' }).format(value as number)} domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.1)]} />
                    <Tooltip contentStyle={{ backgroundColor: '#f8fafc', borderColor: '#cbd5e1', color: '#0f172a' }} formatter={(value: number) => [value.toLocaleString(), '全校學生數']} />
                    <Legend wrapperStyle={{ color: '#475569' }} />
                    <Line type="monotone" dataKey="studentCount" stroke="#14b8a6" strokeWidth={2} activeDot={{ r: 8 }} name="全校學生數" />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

const AspectAnalysisChart: React.FC<{ data: AspectAnalysis }> = ({ data }) => {
    const aspects = [
        { name: '社區連結', ...data.communityConnection },
        { name: '建築物狀況', ...data.buildingCondition },
        { name: '歷史價值', ...data.historicalValue },
        { name: '院落配置', ...data.courtyardLayout },
    ];
    const chartData = aspects.map(({ name, score }) => ({ subject: name, score, fullMark: 10 }));

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
            <div className="w-full h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                        <PolarGrid stroke="#cbd5e1"/>
                        <PolarAngleAxis dataKey="subject" stroke="#94a3b8" tick={{ fill: '#475569', fontSize: 14 }} />
                        <PolarRadiusAxis angle={45} domain={[0, 10]} stroke="#94a3b8" />
                        <Radar name="評分" dataKey="score" stroke="#14b8a6" fill="#14b8a6" fillOpacity={0.6} />
                         <Tooltip contentStyle={{ backgroundColor: '#f8fafc', borderColor: '#cbd5e1', color: '#0f172a' }}/>
                    </RadarChart>
                </ResponsiveContainer>
            </div>
            <div className="space-y-3">
                {aspects.map(aspect => (
                    <div key={aspect.name}>
                        <p className="font-semibold text-brand-text">
                            {aspect.name}: <span className="font-bold text-brand-accent">{aspect.score} / 10</span>
                        </p>
                        <p className="text-sm text-brand-subtext leading-relaxed"><HighlightedText text={aspect.analysis} /></p>
                    </div>
                ))}
            </div>
        </div>
    );
};

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

const ReuseTypeSuggestions: React.FC<{ types: ReuseType[] }> = ({ types }) => (
    <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {types.map(type => (
                <div key={type} className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                    <p className="font-semibold text-amber-800">{type}</p>
                    <p className="text-sm text-brand-subtext leading-relaxed mt-1">{REUSE_TYPE_DESCRIPTIONS[type]}</p>
                </div>
            ))}
        </div>
        <p className="text-xs text-slate-400">依建築型態、在地產業、地方文化與社區組織運作狀況推估，僅供參考。</p>
    </div>
);

const Section: React.FC<{title: string, icon: React.ReactNode, children: React.ReactNode, className?: string}> = ({ title, icon, children, className = '' }) => (
    <div className={`bg-white p-6 rounded-xl border border-slate-200 shadow-sm ${className}`}>
        <h3 className="text-xl font-semibold mb-4 text-brand-text flex items-center">
            {icon}<span className="ml-3">{title}</span>
        </h3>
        {children}
    </div>
);


export const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({ data, id, hideMap = false }) => {
  const {
      basicInfo, environmentalAnalysis, potentialIndex, cityPopulation, populationStructure, schoolEnrollment,
      aspectAnalysis, reuseTypes,
  } = data;
  const mapLink = `https://www.openstreetmap.org/?mlat=${basicInfo.latitude}&mlon=${basicInfo.longitude}#map=18/${basicInfo.latitude}/${basicInfo.longitude}`;
  const mapContainerId = `analysis-map-${id || 'default'}`;
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (hideMap) return;
    if ((window as any).L) {
      setMapLoaded(true);
      return;
    }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
    script.async = true;
    script.onload = () => setMapLoaded(true);
    document.body.appendChild(script);
  }, [hideMap]);

  useEffect(() => {
    if (hideMap || !mapLoaded) return;
    const L = (window as any).L;
    const container = document.getElementById(mapContainerId);
    if (!container) return;

    const map = L.map(mapContainerId).setView([basicInfo.latitude, basicInfo.longitude], 17);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    const markerHtml = `
      <div style="display: flex; flex-direction: column; align-items: center;">
        <div style="
          background-color: white;
          color: #1e293b;
          font-size: 13px;
          font-weight: bold;
          padding: 3px 10px;
          border-radius: 12px;
          border: 2px solid #2dd4bf;
          box-shadow: 0 1.5px 6px rgba(0,0,0,0.25);
          white-space: nowrap;
          max-width: 160px;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-bottom: 3px;
        ">
          ${basicInfo.name}
        </div>
        <div style="
          background-color: #2dd4bf;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 4px solid white;
          box-shadow: 0 3px 12px rgba(0,0,0,0.3);
          font-size: 20px;
        ">
          🏫
        </div>
      </div>
    `;

    const customIcon = L.divIcon({
      html: markerHtml,
      className: '',
      iconSize: [96, 76],
      iconAnchor: [48, 60],
      popupAnchor: [0, -60],
    });

    L.marker([basicInfo.latitude, basicInfo.longitude], { icon: customIcon }).addTo(map);

    return () => {
      map.remove();
    };
  }, [hideMap, mapLoaded, mapContainerId, basicInfo.latitude, basicInfo.longitude, basicInfo.name]);

  const hasLocalFlavor = (environmentalAnalysis.localAttractions?.length > 0) || (environmentalAnalysis.localSpecialtyFoods?.length > 0);

  const sections = [
    { condition: true, component: (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
             <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-center text-brand-text">整建潛能分數</h3>
                  <CpiGauge score={potentialIndex.cpiScore} />
                  <CpiGaugeLegend />
                </div>
            </div>
            {hasLocalFlavor && (
                <Section title="周邊環境特色" icon={<MountainIcon className="w-6 h-6"/>}>
                    <div className="grid grid-cols-1 gap-6">
                        {environmentalAnalysis.localAttractions?.length > 0 && (
                            <div>
                                <div className="flex items-center mb-2">
                                    <MapPinIcon className="w-5 h-5 text-sky-400 mr-2" />
                                    <h5 className="font-semibold text-brand-subtext">地方特色活動與宗教文化</h5>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {environmentalAnalysis.localAttractions.map((item, index) => (
                                        <span key={index} className="text-sm bg-sky-100 text-sky-700 py-1 px-3 rounded-full">{item}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                        {environmentalAnalysis.localSpecialtyFoods?.length > 0 && (
                            <div>
                                <div className="flex items-center mb-2">
                                    <SparklesIcon className="w-5 h-5 text-amber-400 mr-2" />
                                    <h5 className="font-semibold text-brand-subtext">在地產業類型</h5>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {environmentalAnalysis.localSpecialtyFoods.map((item, index) => (
                                        <span key={index} className="text-sm bg-amber-100 text-amber-700 py-1 px-3 rounded-full">{item}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </Section>
            )}
        </div>
        <div className="lg:col-span-2 space-y-6 flex flex-col">
            <Section title="宅院基本資料" icon={<BuildingIcon className="w-6 h-6"/>} className="h-full">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    <InfoItem icon={<ClipboardListIcon className="w-6 h-6"/>} label="宅院代號" value={basicInfo.name} />
                    <InfoItem icon={<BuildingOffice2Icon className="w-6 h-6"/>} label="樓層數" value={basicInfo.floorCount ?? '未提供'} unit={basicInfo.floorCount ? '層' : undefined} />
                    <InfoItem icon={<HistoryIcon className="w-6 h-6"/>} label="文資身分" value={basicInfo.isHeritage ? '是' : '否'} />
                    <InfoItem icon={<MapPinIcon className="w-6 h-6"/>} label="GPS 座標 (緯度, 經度)" value={`${basicInfo.latitude.toFixed(6)}, ${basicInfo.longitude.toFixed(6)}`} />
                    <InfoItem icon={<MapPinIcon className="w-6 h-6"/>} label="地段" value={basicInfo.landSection || '未提供'} />
                    <InfoItem icon={<ListBulletIcon className="w-6 h-6"/>} label="地號" value={basicInfo.landNumber || '未提供'} />
                    <InfoItem icon={<AreaIcon className="w-6 h-6"/>} label="面積" value={basicInfo.landArea || '未提供'} />
                    <InfoItem icon={<GlobeIcon className="w-6 h-6"/>} label="土地使用分區" value={basicInfo.landUseZone || '未提供'} />
                    <InfoItem icon={<ChartBarIcon className="w-6 h-6"/>} label="國土利用調查類別" value={basicInfo.landUseSurveyCategory || '未提供'} />
                </div>
            </Section>
        </div>
      </div>
    )},
    { condition: true, component: <Section title="宅院面向分析" icon={<ShieldIcon className="w-6 h-6"/>}><AspectAnalysisChart data={aspectAnalysis} /></Section> },
    { condition: reuseTypes && reuseTypes.length > 0, component: <Section title="再利用類型建議" icon={<LightbulbIcon className="w-6 h-6"/>}><ReuseTypeSuggestions types={reuseTypes} /></Section> },
    { condition: cityPopulation && cityPopulation.length > 0, component: (
        <Section title="社會資料" icon={<UsersIcon className="w-6 h-6"/>}>
            <PopulationSummary data={cityPopulation} structure={populationStructure} />
            <PopulationChart data={cityPopulation} />
            <p className="text-xs text-slate-400 text-center mt-2">資料來源：中華民國內政部戶政司</p>
        </Section>
    )},
    { condition: false, component: (
        <Section title="學校近年學生人數趨勢" icon={<TrendingUpIcon className="w-6 h-6"/>}>
            <SchoolEnrollmentChart data={schoolEnrollment} />
            <p className="text-xs text-slate-400 text-center mt-2">資料來源：中華民國教育部統計處</p>
        </Section>
    )},
  ];
  
  const visibleSections = sections.filter(s => s.condition);
  let sectionCounter = 0;

  return (
    <div id={id} className="space-y-6 animate-fade-in">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-brand-text">{basicInfo.name}</h2>
                <p className="text-brand-subtext mt-1">
                    <a
                        href={mapLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-brand-accent transition-colors duration-200 underline"
                        title={`在 OpenStreetMap 上查看 ${basicInfo.name}`}
                    >
                        {basicInfo.address}
                    </a>
                </p>
            </div>
            {!hideMap && (
                <div id={mapContainerId} className="h-64 rounded-lg overflow-hidden border-2 border-slate-200 bg-slate-50" />
            )}
        </div>
        
      {visibleSections.map((section, index) => {
          const component = section.component;
          
          // The first visible section is the block with 1, 2, 3.
          // This block doesn't have a `title` prop at its root.
          // Its internal components have hardcoded numbers.
          if (component.props.title === undefined) {
              sectionCounter = 3;
              return <React.Fragment key={index}>{component}</React.Fragment>;
          }

          // For all subsequent visible sections, increment counter and inject title.
          sectionCounter++;
          const originalTitle = component.props.title;
          return React.cloneElement(component, { key: index, title: originalTitle });
      })}
    </div>
  );
};