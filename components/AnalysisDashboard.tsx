

import React, { FC, useEffect, useState } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { AnalysisData, PopulationDataPoint, SchoolEnrollmentDataPoint, FiveForcesAnalysis } from '../types';
import { BuildingIcon, MountainIcon, HistoryIcon, UsersIcon, TrendingUpIcon, ShieldIcon, MapPinIcon, SparklesIcon, BuildingOffice2Icon, LeafIcon, UserGroupIcon } from './icons';

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
        <div className="relative w-full h-48 sm:h-64">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie data={data} cx="50%" cy="50%" startAngle={180} endAngle={0} innerRadius="70%" outerRadius="100%" fill="#8884d8" paddingAngle={2} dataKey="value" stroke="none">
                        {data.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [`${value}`, '整建分數']} contentStyle={{ backgroundColor: '#f8fafc', borderColor: '#cbd5e1', color: '#0f172a' }}/>
                </PieChart>
            </ResponsiveContainer>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/3 text-center">
                <p className="text-4xl sm:text-5xl font-bold" style={{ color: levelColor }}>{score}</p>
                <p className="text-sm text-brand-subtext">整建分數</p>
                <span
                    className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: levelColor }}
                >
                    整建潛力 - {getScoreLevelText(score)}
                </span>
            </div>
        </div>
    );
};

const PopulationChart: React.FC<{ data: PopulationDataPoint[] }> = ({ data }) => {
    const sortedData = [...data].sort((a, b) => a.year - b.year);
    return (
        <div className="w-full h-80 bg-slate-50 p-4 rounded-lg border border-slate-200 shadow-sm">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sortedData} margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                    <XAxis dataKey="year" stroke="#475569" />
                    <YAxis stroke="#475569" tickFormatter={(value) => new Intl.NumberFormat('en-US', { notation: 'compact', compactDisplay: 'short' }).format(value as number)} domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.1)]} />
                    <Tooltip contentStyle={{ backgroundColor: '#f8fafc', borderColor: '#cbd5e1', color: '#0f172a' }} formatter={(value: number) => [value.toLocaleString(), '人口數']} />
                    <Legend wrapperStyle={{ color: '#475569' }} />
                    <Line type="monotone" dataKey="population" stroke="#14b8a6" strokeWidth={2} activeDot={{ r: 8 }} name="人口數" />
                </LineChart>
            </ResponsiveContainer>
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

const FiveForcesAnalysisChart: React.FC<{ data: FiveForcesAnalysis }> = ({ data }) => {
    const chartData = [
        { subject: '同業競爭', score: data.industryRivalry.score, fullMark: 10 },
        { subject: '新進者威脅', score: data.threatOfNewEntrants.score, fullMark: 10 },
        { subject: '買家議價力', score: data.bargainingPowerOfBuyers.score, fullMark: 10 },
        { subject: '供應商議價力', score: data.bargainingPowerOfSuppliers.score, fullMark: 10 },
        { subject: '替代品威脅', score: data.threatOfSubstituteProducts.score, fullMark: 10 },
    ];
    
    const forceDetails = [
      { name: '同業競爭', ...data.industryRivalry },
      { name: '新進者威脅', ...data.threatOfNewEntrants },
      { name: '買家議價力', ...data.bargainingPowerOfBuyers },
      { name: '供應商議價力', ...data.bargainingPowerOfSuppliers },
      { name: '替代品威脅', ...data.threatOfSubstituteProducts },
    ];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
            <div className="w-full h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                        <PolarGrid stroke="#cbd5e1"/>
                        <PolarAngleAxis dataKey="subject" stroke="#94a3b8" tick={{ fill: '#475569', fontSize: 14 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 10]} stroke="#94a3b8" />
                        <Radar name="威脅分數" dataKey="score" stroke="#14b8a6" fill="#14b8a6" fillOpacity={0.6} />
                         <Tooltip contentStyle={{ backgroundColor: '#f8fafc', borderColor: '#cbd5e1', color: '#0f172a' }}/>
                    </RadarChart>
                </ResponsiveContainer>
            </div>
            <div className="space-y-3">
                {forceDetails.map(force => (
                    <div key={force.name}>
                        <p className="font-semibold text-brand-text">
                            {force.name}: <span className="font-bold text-brand-accent">{force.score} / 10</span>
                        </p>
                        <p className="text-sm text-brand-subtext leading-relaxed"><HighlightedText text={force.analysis} /></p>
                    </div>
                ))}
            </div>
        </div>
    );
};

const Section: React.FC<{title: string, icon: React.ReactNode, children: React.ReactNode}> = ({ title, icon, children }) => (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-xl font-semibold mb-4 text-brand-text flex items-center">
            {icon}<span className="ml-3">{title}</span>
        </h3>
        {children}
    </div>
);


export const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({ data, id, hideMap = false }) => {
  const {
      basicInfo, environmentalAnalysis, potentialIndex, cityPopulation, schoolEnrollment,
      fiveForcesAnalysis,
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
             <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-full flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-center text-brand-text">整建分數</h3>
                  <CpiGauge score={potentialIndex.cpiScore} />
                </div>
            </div>
        </div>
        <div className="lg:col-span-2 space-y-6">
            <Section title="宅院基本資料" icon={<BuildingIcon className="w-6 h-6"/>}>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    <InfoItem icon={<BuildingIcon className="w-6 h-6"/>} label="建築型態" value={basicInfo.buildingType || '未提供'} />
                    <InfoItem icon={<BuildingOffice2Icon className="w-6 h-6"/>} label="樓層數" value={basicInfo.floorCount ?? '未提供'} unit={basicInfo.floorCount ? '層' : undefined} />
                    <InfoItem icon={<HistoryIcon className="w-6 h-6"/>} label="文資身分" value={basicInfo.isHeritage ? '是' : '否'} />
                    <InfoItem icon={<LeafIcon className="w-6 h-6"/>} label="農村再生社區" value={basicInfo.isRuralRevitalizationCommunity ? '是' : '否'} />
                    <InfoItem icon={<UserGroupIcon className="w-6 h-6"/>} label="社區組織運作狀況" value={basicInfo.communityOrgStatus || '未提供'} />
                </div>
            </Section>
            {hasLocalFlavor && (
                <Section title="周邊環境特色" icon={<MountainIcon className="w-6 h-6"/>}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {environmentalAnalysis.localAttractions?.length > 0 && (
                            <div>
                                <div className="flex items-center mb-2">
                                    <MapPinIcon className="w-5 h-5 text-sky-400 mr-2" />
                                    <h5 className="font-semibold text-brand-subtext">特色景點</h5>
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
                                    <h5 className="font-semibold text-brand-subtext">特色美食</h5>
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
      </div>
    )},
    { condition: cityPopulation && cityPopulation.length > 0, component: (
        <Section title="所在城市人口趨勢" icon={<UsersIcon className="w-6 h-6"/>}>
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
    { condition: true, component: <Section title="產業競爭環境 (Five Forces) 分析" icon={<ShieldIcon className="w-6 h-6"/>}><FiveForcesAnalysisChart data={fiveForcesAnalysis} /></Section> },
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