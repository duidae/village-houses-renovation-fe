import React, { FC, useState } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { AnalysisData, NewsItem, PopulationDataPoint, SchoolEnrollmentDataPoint, FiveForcesAnalysis, SchoolHealthIndex, PestAnalysis, InternalHealthMetrics, SwotAnalysis, MetricItem, StrategicRecommendation, ImpactAssessment, ImpactMetric, TrendProjection } from '../types';
import { BuildingIcon, CalendarIcon, AreaIcon, MountainIcon, WaveIcon, RiverIcon, TrainIcon, LightbulbIcon, HistoryIcon, NewspaperIcon, UsersIcon, TrendingUpIcon, ShieldIcon, GlobeIcon, ClipboardListIcon, PuzzleIcon, HeartbeatIcon, MapPinIcon, SparklesIcon, KeyIcon, CpuChipIcon, BuildingOffice2Icon, PaintBrushIcon, ChartBarIcon, LeafIcon } from './icons';

// --- Keyword Highlighting Component & Definitions ---

const LABEL_STYLE = 'bg-teal-500/10 text-teal-300 ring-1 ring-teal-500/20';
const UNDERLINE_STYLE = 'no-underline border-b-2 border-teal-500/50 font-medium text-teal-300';


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

const CpiGauge: React.FC<{ score: number }> = ({ score }) => {
    const data = [ { name: 'Score', value: score }, { name: 'Remaining', value: 100 - score }, ];
    const COLORS = ['#2dd4bf', '#27272a']; // teal-400, zinc-800

    return (
        <div className="relative w-full h-48 sm:h-64">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie data={data} cx="50%" cy="50%" startAngle={180} endAngle={0} innerRadius="70%" outerRadius="100%" fill="#8884d8" paddingAngle={2} dataKey="value" stroke="none">
                        {data.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [`${value}`, '分數']} contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a' }}/>
                </PieChart>
            </ResponsiveContainer>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/3 text-center">
                <p className="text-4xl sm:text-5xl font-bold text-brand-accent">{score}</p>
                <p className="text-sm text-brand-subtext">潛力指數</p>
            </div>
        </div>
    );
};

const NewsSection: React.FC<{news: NewsItem[]}> = ({ news }) => {
    if (!news || news.length === 0) return <p className="text-brand-subtext text-center py-8">無相關動態資訊。</p>;
    return (
        <div className="space-y-4">
            {news.map((item, index) => (
                <div key={index} className="bg-zinc-800/50 p-4 rounded-lg flex items-start space-x-4">
                    <NewspaperIcon className="w-6 h-6 text-brand-accent flex-shrink-0 mt-1"/>
                    <div>
                        <div className="flex justify-between items-baseline">
                            <h5 className="font-semibold text-brand-text">{item.title}</h5>
                            <span className="text-xs text-zinc-500 ml-4 whitespace-nowrap">{item.date}</span>
                        </div>
                        <p className="text-sm text-brand-subtext mt-1"><HighlightedText text={item.summary} /></p>
                    </div>
                </div>
            ))}
        </div>
    );
};

const PopulationChart: React.FC<{ data: PopulationDataPoint[] }> = ({ data }) => {
    const sortedData = [...data].sort((a, b) => a.year - b.year);
    return (
        <div className="w-full h-80 bg-zinc-900/50 p-4 rounded-lg">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sortedData} margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                    <XAxis dataKey="year" stroke="#a1a1aa" />
                    <YAxis stroke="#a1a1aa" tickFormatter={(value) => new Intl.NumberFormat('en-US', { notation: 'compact', compactDisplay: 'short' }).format(value as number)} domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.1)]} />
                    <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#e4e4e7' }} formatter={(value: number) => [value.toLocaleString(), '人口數']} />
                    <Legend wrapperStyle={{ color: '#a1a1aa' }} />
                    <Line type="monotone" dataKey="population" stroke="#14b8a6" strokeWidth={2} activeDot={{ r: 8 }} name="人口數" />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

const SchoolEnrollmentChart: React.FC<{ data: SchoolEnrollmentDataPoint[] }> = ({ data }) => {
    const sortedData = [...data].sort((a, b) => a.year - b.year);
    return (
        <div className="w-full h-80 bg-zinc-900/50 p-4 rounded-lg">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sortedData} margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                    <XAxis dataKey="year" stroke="#a1a1aa" />
                    <YAxis stroke="#a1a1aa" tickFormatter={(value) => new Intl.NumberFormat('en-US', { notation: 'compact', compactDisplay: 'short' }).format(value as number)} domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.1)]} />
                    <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#e4e4e7' }} formatter={(value: number) => [value.toLocaleString(), '全校學生數']} />
                    <Legend wrapperStyle={{ color: '#a1a1aa' }} />
                    <Line type="monotone" dataKey="studentCount" stroke="#14b8a6" strokeWidth={2} activeDot={{ r: 8 }} name="全校學生數" />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

const TrendProjectionChart: React.FC<{
    cityPopulation: PopulationDataPoint[];
    schoolEnrollment: SchoolEnrollmentDataPoint[];
    trendProjection: TrendProjection;
}> = ({ cityPopulation, schoolEnrollment, trendProjection }) => {
    // 1. Create a map of historical data
    const historicalMap = new Map();
    cityPopulation.forEach(d => historicalMap.set(d.year, { ...historicalMap.get(d.year), population: d.population }));
    schoolEnrollment.forEach(d => historicalMap.set(d.year, { ...historicalMap.get(d.year), studentCount: d.studentCount }));
    const historicalData = Array.from(historicalMap.entries()).map(([year, data]) => ({ year, ...data })).sort((a, b) => a.year - b.year);

    // 2. Create projection data for chart, including last historical point for connection
    const lastHistoricalPoint = historicalData[historicalData.length-1];

    const projectionForChart = [
        {
            year: lastHistoricalPoint.year,
            projectedPopulation: lastHistoricalPoint.population,
            projectedStudentCount: lastHistoricalPoint.studentCount,
        },
        ...trendProjection.projectionData.map(p => ({
            year: p.year,
            projectedPopulation: p.projectedPopulation,
            projectedStudentCount: p.projectedStudentCount,
        }))
    ];

    // 3. Merge historical and projection data
    const finalDataMap = new Map();
    historicalData.forEach(d => finalDataMap.set(d.year, {
        year: d.year,
        population: d.population,
        studentCount: d.studentCount,
    }));
    projectionForChart.forEach(p => {
        const existing = finalDataMap.get(p.year) || { year: p.year };
        finalDataMap.set(p.year, {
            ...existing,
            projectedPopulation: p.projectedPopulation,
            projectedStudentCount: p.projectedStudentCount,
        });
    });

    const finalChartData = Array.from(finalDataMap.values()).sort((a, b) => a.year - b.year);

    return (
        <div className="space-y-6">
            <div className="w-full h-96 bg-zinc-900/50 p-4 rounded-lg">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={finalChartData} margin={{ top: 5, right: 30, left: 30, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                        <XAxis dataKey="year" stroke="#a1a1aa" />
                        <YAxis yAxisId="left" stroke="#14b8a6" label={{ value: '城市人口', angle: -90, position: 'insideLeft', fill: '#14b8a6', style: {textAnchor: 'middle'} }} tickFormatter={(value) => new Intl.NumberFormat('en-US', { notation: 'compact', compactDisplay: 'short' }).format(value as number)} />
                        <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" label={{ value: '學生人數', angle: 90, position: 'insideRight', fill: '#f59e0b', style: {textAnchor: 'middle'} }} tickFormatter={(value) => new Intl.NumberFormat('en-US', { notation: 'compact', compactDisplay: 'short' }).format(value as number)} />
                        <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#e4e4e7' }} />
                        <Legend wrapperStyle={{ color: '#a1a1aa', paddingTop: '10px' }} />

                        <Line yAxisId="left" type="monotone" dataKey="population" stroke="#14b8a6" strokeWidth={2} activeDot={{ r: 6 }} name="歷史人口" connectNulls />
                        <Line yAxisId="left" type="monotone" dataKey="projectedPopulation" stroke="#14b8a6" strokeWidth={2} strokeDasharray="5 5" name="預估人口" connectNulls />

                        <Line yAxisId="right" type="monotone" dataKey="studentCount" stroke="#f59e0b" strokeWidth={2} activeDot={{ r: 6 }} name="歷史學生數" connectNulls />
                        <Line yAxisId="right" type="monotone" dataKey="projectedStudentCount" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" name="預估學生數" connectNulls />
                    </LineChart>
                </ResponsiveContainer>
            </div>
            <p className="text-brand-subtext text-center max-w-3xl mx-auto leading-relaxed"><HighlightedText text={trendProjection.analysis} /></p>
        </div>
    );
};

// --- New Strategic Analysis Components ---

const PestAnalysisDisplay: React.FC<{ data: PestAnalysis }> = ({ data }) => {
    const items = [
        { title: 'Political (政策)', content: data.political, color: 'text-sky-400' },
        { title: 'Economic (經濟)', content: data.economic, color: 'text-emerald-400' },
        { title: 'Social (社會)', content: data.social, color: 'text-amber-400' },
        { title: 'Technological (技術)', content: data.technological, color: 'text-violet-400' },
    ];
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {items.map(item => (
                <div key={item.title} className="bg-zinc-800/50 p-4 rounded-lg">
                    <h4 className={`font-bold text-lg ${item.color}`}>{item.title}</h4>
                    <p className="text-brand-subtext text-sm mt-2 leading-relaxed"><HighlightedText text={item.content} /></p>
                </div>
            ))}
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
                        <PolarGrid stroke="#3f3f46"/>
                        <PolarAngleAxis dataKey="subject" stroke="#e4e4e7" tick={{ fill: '#e4e4e7', fontSize: 14 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 10]} stroke="#a1a1aa" />
                        <Radar name="威脅分數" dataKey="score" stroke="#14b8a6" fill="#14b8a6" fillOpacity={0.6} />
                         <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#e4e4e7' }}/>
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

const InternalHealthDisplay: React.FC<{ data: InternalHealthMetrics }> = ({ data }) => {
    const categories = [
        { title: "招生指標", metrics: data.enrollment, color: "border-sky-500" },
        { title: "財務指標", metrics: data.financial, color: "border-emerald-500" },
        { title: "品牌與品質", metrics: data.brand, color: "border-amber-500" },
        { title: "營運能力", metrics: data.operational, color: "border-violet-500" }
    ];

    const MetricCard: React.FC<{ item: MetricItem }> = ({ item }) => (
        <div className="bg-zinc-800/50 p-3 rounded-md">
            <div className="flex justify-between items-center">
                <p className="text-sm font-semibold text-brand-text">{item.metric}</p>
                <p className="text-sm font-bold text-brand-accent bg-zinc-700 px-2 py-0.5 rounded">{item.value}</p>
            </div>
            <p className="text-xs text-brand-subtext mt-1 leading-relaxed"><HighlightedText text={item.analysis} /></p>
        </div>
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map(cat => (
                <div key={cat.title} className={`border-l-4 ${cat.color} pl-4`}>
                    <h4 className="font-bold text-lg text-brand-text mb-3">{cat.title}</h4>
                    <div className="space-y-3">
                        {cat.metrics.map(metric => <MetricCard key={metric.metric} item={metric} />)}
                    </div>
                </div>
            ))}
        </div>
    );
};

const SwotAnalysisDisplay: React.FC<{ data: SwotAnalysis }> = ({ data }) => {
    const items = [
        { title: 'Strengths (優勢)', items: data.strengths, bgColor: 'bg-emerald-500/10', textColor: 'text-emerald-300' },
        { title: 'Weaknesses (劣勢)', items: data.weaknesses, bgColor: 'bg-red-500/10', textColor: 'text-red-400' },
        { title: 'Opportunities (機會)', items: data.opportunities, bgColor: 'bg-sky-500/10', textColor: 'text-sky-300' },
        { title: 'Threats (威脅)', items: data.threats, bgColor: 'bg-amber-500/10', textColor: 'text-amber-300' },
    ];
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {items.map(item => (
                <div key={item.title} className={`p-4 rounded-lg ${item.bgColor}`}>
                    <h4 className={`font-bold text-lg mb-2 ${item.textColor}`}>{item.title}</h4>
                    <ul className="list-disc list-inside space-y-1 text-brand-subtext text-sm leading-relaxed">
                        {item.items.map((point, index) => <li key={index}><HighlightedText text={point} /></li>)}
                    </ul>
                </div>
            ))}
        </div>
    );
};

const SchoolHealthIndexGauge: React.FC<{ data: SchoolHealthIndex }> = ({ data }) => {
    const { score, level, summary } = data;

    const getHealthColor = (s: number) => {
        if (s >= 75) return 'bg-teal-500';
        if (s >= 50) return 'bg-amber-500';
        if (s >= 25) return 'bg-orange-500';
        return 'bg-red-500';
    };

    const getLevelTextColor = (l: string) => {
        switch(l) {
            case 'Excellent': return 'text-teal-400';
            case 'Good': return 'text-amber-400';
            case 'Fair': return 'text-orange-400';
            case 'Critical': return 'text-red-400';
            default: return 'text-brand-text';
        }
    }

    const getLevelText = (l: string) => {
        switch(l) {
            case 'Excellent': return '極佳';
            case 'Good': return '良好';
            case 'Fair': return '普通';
            case 'Critical': return '危險';
            default: return l;
        }
    }

    return (
        <div className="space-y-4">
            <div className="w-full bg-zinc-700 rounded-full h-6">
                <div
                    className={`h-6 rounded-full transition-all duration-1000 ease-out ${getHealthColor(score)}`}
                    style={{ width: `${score}%` }}
                />
            </div>
            <div className="text-center">
                <p className="text-brand-subtext">健康度指數</p>
                <p className="text-4xl font-bold text-brand-text my-1">{score} <span className="text-2xl">/ 100</span></p>
                <p className={`text-xl font-semibold ${getLevelTextColor(level)}`}>{getLevelText(level)}</p>
            </div>
            <p className="text-brand-subtext text-center max-w-2xl mx-auto"><HighlightedText text={summary} /></p>
        </div>
    );
};

const StrategicRecommendationsDisplay: React.FC<{ recommendations: StrategicRecommendation[] }> = ({ recommendations }) => {
    const getCardStyle = (type: StrategicRecommendation['type']) => {
        switch (type) {
            case '產業升級型':
                return {
                    icon: <CpuChipIcon className="w-6 h-6 text-sky-400" />,
                    borderColor: 'border-sky-800/50',
                    bgColor: 'bg-sky-900/10',
                    textColor: 'text-sky-400',
                    labelClass: 'bg-sky-500/10 text-sky-300 ring-1 ring-sky-500/20',
                };
            case '社會需求型':
                return {
                    icon: <BuildingOffice2Icon className="w-6 h-6 text-emerald-400" />,
                    borderColor: 'border-emerald-800/50',
                    bgColor: 'bg-emerald-900/10',
                    textColor: 'text-emerald-400',
                    labelClass: 'bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/20',
                };
            case '地方再生型':
                return {
                    icon: <PaintBrushIcon className="w-6 h-6 text-amber-400" />,
                    borderColor: 'border-amber-800/50',
                    bgColor: 'bg-amber-900/10',
                    textColor: 'text-amber-400',
                    labelClass: 'bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/20',
                };
            default:
                return {
                    icon: <LightbulbIcon className="w-6 h-6 text-zinc-400" />,
                    borderColor: 'border-zinc-700',
                    bgColor: 'bg-zinc-800/50',
                    textColor: 'text-zinc-400',
                    labelClass: LABEL_STYLE,
                };
        }
    };

    const policyTagStyle = "bg-brand-secondary/30 text-brand-accent border border-brand-secondary/50 hover:bg-brand-secondary/50";

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {recommendations.map((rec, index) => {
                const style = getCardStyle(rec.type);
                return (
                    <div key={index} className={`p-5 rounded-lg border ${style.borderColor} ${style.bgColor} flex flex-col space-y-4`}>
                        <div className="flex items-center space-x-3">
                            {style.icon}
                            <span className={`font-semibold text-sm px-3 py-1 rounded-full ${style.bgColor} border ${style.borderColor} ${style.textColor}`}>{rec.type}</span>
                        </div>
                        <h4 className="font-bold text-lg text-brand-text">{rec.project}</h4>
                        <p className="text-brand-subtext text-sm flex-grow leading-relaxed"><span className="font-semibold text-zinc-400">理由：</span><HighlightedText text={rec.reason} styleType="label" customLabelClass={style.labelClass} /></p>
                        {rec.policyAlignment && rec.policyAlignment.length > 0 && (
                            <div>
                                <h5 className="text-sm font-semibold text-zinc-400 mb-2">可對接政策：</h5>
                                <div className="flex flex-wrap gap-2">
                                    {rec.policyAlignment.map((policy, pIndex) => (
                                        <span key={pIndex} className={`text-xs py-1 px-3 rounded-full transition-colors cursor-default ${policyTagStyle}`}>
                                            {policy}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

const ImpactAssessmentDisplay: React.FC<{ data: ImpactAssessment }> = ({ data }) => {
    const { economic, social, sustainability, summary } = data;

    const categories = [
        { title: "經濟效益", metrics: economic, icon: <TrendingUpIcon className="w-8 h-8 text-sky-400" />, color: "border-sky-500", textColor: "text-sky-400" },
        { title: "社會效益", metrics: social, icon: <UsersIcon className="w-8 h-8 text-emerald-400" />, color: "border-emerald-500", textColor: "text-emerald-400" },
        { title: "永續效益", metrics: sustainability, icon: <LeafIcon className="w-8 h-8 text-amber-400" />, color: "border-amber-500", textColor: "text-amber-400" }
    ];

    const MetricCard: React.FC<{ item: ImpactMetric }> = ({ item }) => (
        <div className="bg-zinc-800/50 p-4 rounded-lg transform transition-transform hover:scale-105">
            <p className="font-semibold text-brand-text">{item.metric}</p>
            <p className="text-2xl font-bold text-brand-accent my-1">{item.value}</p>
            <p className="text-xs text-brand-subtext leading-relaxed"><HighlightedText text={item.description} /></p>
        </div>
    );

    return (
        <div className="space-y-8">
            <p className="text-center text-brand-subtext text-lg max-w-3xl mx-auto leading-relaxed border-t border-b border-zinc-700 py-4"><HighlightedText text={summary} /></p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {categories.map(cat => (
                    <div key={cat.title} className={`p-5 rounded-xl bg-zinc-900/50 border-2 ${cat.color}/30`}>
                        <div className="flex items-center space-x-3 mb-4">
                            {cat.icon}
                            <h4 className={`text-xl font-bold ${cat.textColor}`}>{cat.title}</h4>
                        </div>
                        <div className="space-y-4">
                            {cat.metrics.map((metric, index) => <MetricCard key={index} item={metric} />)}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};


const Section: React.FC<{title: string, icon: React.ReactNode, children: React.ReactNode}> = ({ title, icon, children }) => (
    <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
        <h3 className="text-xl font-semibold mb-4 text-brand-text flex items-center">
            {icon}<span className="ml-3">{title}</span>
        </h3>
        {children}
    </div>
);


export const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({ data, id }) => {
  const {
      basicInfo, environmentalAnalysis, potentialIndex, recommendations, strategicRecommendations,
      impactAssessment, pastCases, recentNews, cityPopulation, schoolEnrollment, pestAnalysis,
      fiveForcesAnalysis, internalHealthMetrics, swotAnalysis, schoolHealthIndex, trendProjection
  } = data;
  const mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(basicInfo.address)}&t=k&z=18&output=embed&hl=zh-TW`;

  const [activeTab, setActiveTab] = useState<'school' | 'city'>('school');

  const sections = [
    { condition: true, component: (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
            <Section title="1. 校地基礎資訊" icon={<BuildingIcon className="w-6 h-6"/>}>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    <InfoItem icon={<CalendarIcon className="w-6 h-6"/>} label="創校年份" value={basicInfo.foundedYear} unit={`(${new Date().getFullYear() - basicInfo.foundedYear} 年校齡)`}/>
                    <InfoItem icon={<AreaIcon className="w-6 h-6"/>} label="校地面積" value={basicInfo.areaSqM.toLocaleString()} unit="m²" />
                    <InfoItem icon={<BuildingIcon className="w-6 h-6"/>} label="建築覆蓋率" value={`${basicInfo.buildingCoverage}%`} />
                </div>
            </Section>
            <Section title="2. 周邊環境分析" icon={<MountainIcon className="w-6 h-6"/>}>
                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    <InfoItem icon={<MountainIcon className="w-6 h-6"/>} label="地形 / 海拔" value={environmentalAnalysis.terrain} unit={`${environmentalAnalysis.avgElevationM} m`} />
                    <InfoItem icon={<WaveIcon className="w-6 h-6"/>} label="距海岸" value={environmentalAnalysis.coastDistanceKm} unit="km" />
                    <InfoItem icon={<RiverIcon className="w-6 h-6"/>} label="距河川" value={environmentalAnalysis.riverDistanceKm} unit="km" />
                    <InfoItem icon={<TrainIcon className="w-6 h-6"/>} label="最近車站" value={environmentalAnalysis.nearestStation} />
                    <InfoItem icon={<TrainIcon className="w-6 h-6"/>} label="交通分數" value={`${environmentalAnalysis.transportationScore} / 10`} />
                </div>
                {(environmentalAnalysis.localAttractions?.length > 0 || environmentalAnalysis.localSpecialtyFoods?.length > 0) && (
                    <div className="mt-6 pt-6 border-t border-zinc-800">
                        <h4 className="text-md font-semibold text-brand-text mb-4">區域特色</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {environmentalAnalysis.localAttractions?.length > 0 && (
                                <div>
                                    <div className="flex items-center mb-2">
                                        <MapPinIcon className="w-5 h-5 text-sky-400 mr-2" />
                                        <h5 className="font-semibold text-brand-subtext">特色景點</h5>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {environmentalAnalysis.localAttractions.map((item, index) => (
                                            <span key={index} className="text-sm bg-sky-900/50 text-sky-300 py-1 px-3 rounded-full">{item}</span>
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
                                            <span key={index} className="text-sm bg-amber-900/50 text-amber-300 py-1 px-3 rounded-full">{item}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Section>
        </div>
        <div className="space-y-6">
             <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 h-full flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-center text-brand-text">3. 潛力指標 (CPI)</h3>
                  <CpiGauge score={potentialIndex.cpiScore} />
                </div>
                <p className="text-center text-brand-subtext mt-2 px-2"><HighlightedText text={potentialIndex.summary} /></p>
                 <p className="text-center text-sm text-zinc-500 mt-4 px-2">* 指數為模型估算，計算參考公式：<br/><span className="font-mono text-brand-accent">CPI = (交通x0.4) + (環境x0.3) + (面積x0.2) + (校齡x0.1)</span></p>
            </div>
        </div>
      </div>
    )},
    { condition: (recentNews?.schoolNews?.length > 0) || (recentNews?.cityNews?.length > 0), component: (
        <Section title="近期相關動態" icon={<NewspaperIcon className="w-6 h-6"/>}>
            <div className="flex space-x-2 border-b border-zinc-700 mb-4">
                <button onClick={() => setActiveTab('school')} className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'school' ? 'bg-brand-secondary text-white' : 'text-brand-subtext hover:bg-zinc-700'}`}>學校近期動態</button>
                <button onClick={() => setActiveTab('city')} className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'city' ? 'bg-brand-secondary text-white' : 'text-brand-subtext hover:bg-zinc-700'}`}>城市近期動態</button>
            </div>
            <div>
                {activeTab === 'school' && <NewsSection news={recentNews.schoolNews} />}
                {activeTab === 'city' && <NewsSection news={recentNews.cityNews} />}
            </div>
        </Section>
    )},
    { condition: cityPopulation && cityPopulation.length > 0, component: (
        <Section title="所在城市人口趨勢" icon={<UsersIcon className="w-6 h-6"/>}>
            <PopulationChart data={cityPopulation} />
            <p className="text-xs text-zinc-600 text-center mt-2">資料來源：中華民國內政部戶政司</p>
        </Section>
    )},
    { condition: schoolEnrollment && schoolEnrollment.length > 0, component: (
        <Section title="學校近年學生人數趨勢" icon={<TrendingUpIcon className="w-6 h-6"/>}>
            <SchoolEnrollmentChart data={schoolEnrollment} />
            <p className="text-xs text-zinc-600 text-center mt-2">資料來源：中華民國教育部統計處</p>
        </Section>
    )},
     { condition: trendProjection && trendProjection.projectionData.length > 0, component: (
        <Section title="未來 5 年趨勢推估" icon={<ChartBarIcon className="w-6 h-6"/>}>
            <TrendProjectionChart
                cityPopulation={cityPopulation}
                schoolEnrollment={schoolEnrollment}
                trendProjection={trendProjection}
            />
        </Section>
    )},
    { condition: true, component: <Section title="外部宏觀環境 (PEST) 分析" icon={<GlobeIcon className="w-6 h-6"/>}><PestAnalysisDisplay data={pestAnalysis} /></Section> },
    { condition: true, component: <Section title="產業競爭環境 (Five Forces) 分析" icon={<ShieldIcon className="w-6 h-6"/>}><FiveForcesAnalysisChart data={fiveForcesAnalysis} /></Section> },
    { condition: true, component: <Section title="內部營運健康度指標" icon={<ClipboardListIcon className="w-6 h-6"/>}><InternalHealthDisplay data={internalHealthMetrics} /></Section> },
    { condition: true, component: <Section title="策略定位 (SWOT) 整合分析" icon={<PuzzleIcon className="w-6 h-6"/>}><SwotAnalysisDisplay data={swotAnalysis} /></Section> },
    { condition: true, component: <Section title="綜合評估健康指數" icon={<HeartbeatIcon className="w-6 h-6"/>}><SchoolHealthIndexGauge data={schoolHealthIndex} /></Section> },
    { condition: recommendations && recommendations.length > 0, component: (
        <Section title="初步活化方向建議" icon={<LightbulbIcon className="w-6 h-6"/>}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendations.map((rec, index) => (
                    <div key={index} className="bg-teal-900/20 p-5 rounded-lg border border-teal-800/50 transform hover:scale-105 hover:border-teal-700 transition-all duration-300">
                        <div className="flex items-center mb-3">
                            <LightbulbIcon className="w-6 h-6 text-amber-300 mr-3"/>
                            <h4 className="font-bold text-lg text-brand-text">{rec.title}</h4>
                        </div>
                        <p className="text-brand-subtext text-sm mb-3 leading-relaxed"><HighlightedText text={rec.description} styleType="label" /></p>
                        <div className="text-xs text-brand-accent bg-teal-500/10 p-2 rounded-md leading-relaxed"><span className="font-semibold">理由：</span><HighlightedText text={rec.reason} styleType="label" /></div>
                    </div>
                ))}
            </div>
        </Section>
    )},
    { condition: pastCases && pastCases.length > 0, component: (
        <Section title="相似條件活化案例" icon={<HistoryIcon className="w-6 h-6"/>}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pastCases.map((pcase, index) => (
                    <div key={index} className="bg-zinc-800/50 p-5 rounded-lg border border-zinc-700 flex flex-col space-y-3">
                        <div className="flex items-center">
                            <HistoryIcon className="w-6 h-6 text-brand-accent mr-3 flex-shrink-0"/>
                            <div>
                                <h4 className="font-bold text-lg text-brand-text">{pcase.schoolName}</h4>
                                <p className="text-xs text-brand-subtext">{pcase.location}</p>
                            </div>
                        </div>
                        <div className="text-sm space-y-2 text-brand-subtext leading-relaxed">
                            <p><span className="font-semibold text-zinc-400">原始條件：</span><HighlightedText text={pcase.originalCondition} styleType="label" /></p>
                            <p><span className="font-semibold text-zinc-400">活化主題：</span><span className="font-semibold text-amber-400"><HighlightedText text={pcase.revitalizationTheme} styleType="label" /></span></p>
                            <p><span className="font-semibold text-zinc-400">最終成果：</span><HighlightedText text={pcase.outcome} styleType="label" /></p>
                        </div>
                    </div>
                ))}
            </div>
        </Section>
    )},
    { condition: strategicRecommendations && strategicRecommendations.length > 0, component: (
        <Section title="策略性活化方向分析" icon={<KeyIcon className="w-6 h-6"/>}>
            <StrategicRecommendationsDisplay recommendations={strategicRecommendations} />
        </Section>
    )},
    { condition: impactAssessment && (impactAssessment.economic.length > 0 || impactAssessment.social.length > 0 || impactAssessment.sustainability.length > 0), component: (
        <Section title="預期效益與影響力評估" icon={<ChartBarIcon className="w-6 h-6"/>}>
            <ImpactAssessmentDisplay data={impactAssessment} />
        </Section>
    )},
  ];

  const visibleSections = sections.filter(s => s.condition);
  let sectionCounter = 0;

  return (
    <div id={id} className="space-y-6 animate-fade-in">
        <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800 space-y-4">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-brand-text">{basicInfo.name}</h2>
                <p className="text-brand-subtext mt-1">
                    <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(basicInfo.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-brand-accent transition-colors duration-200 underline"
                        title={`在 Google 地圖上查看 ${basicInfo.name}`}
                    >
                        {basicInfo.address}
                    </a>
                </p>
            </div>
            <div className="h-64 rounded-lg overflow-hidden border-2 border-zinc-700">
                <iframe title="School Location" src={mapSrc} width="100%" height="100%" style={{ border: 0 }} allowFullScreen={false} loading="lazy" referrerPolicy="no-referrer-when-downgrade"></iframe>
            </div>
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
          const titleWithoutNumber = originalTitle.replace(/^\d+\.\s*/, '');
          const newTitle = `${sectionCounter}. ${titleWithoutNumber}`;

          return React.cloneElement(component, { key: index, title: newTitle });
      })}
    </div>
  );
};
