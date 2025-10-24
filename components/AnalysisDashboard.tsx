import React, { FC, useState } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { AnalysisData, NewsItem, PopulationDataPoint, SchoolEnrollmentDataPoint, FiveForcesAnalysis, SchoolHealthIndex, PestAnalysis, InternalHealthMetrics, SwotAnalysis, MetricItem } from '../types';
import { BuildingIcon, CalendarIcon, AreaIcon, MountainIcon, WaveIcon, RiverIcon, TrainIcon, LightbulbIcon, HistoryIcon, NewspaperIcon, UsersIcon, TrendingUpIcon, ShieldIcon, GlobeIcon, ClipboardListIcon, PuzzleIcon, HeartbeatIcon } from './icons';

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
                        <p className="text-sm text-brand-subtext mt-1">{item.summary}</p>
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
                    <p className="text-brand-subtext text-sm mt-2">{item.content}</p>
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
                        <p className="text-sm text-brand-subtext">{force.analysis}</p>
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
            <p className="text-xs text-brand-subtext mt-1">{item.analysis}</p>
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
                    <ul className="list-disc list-inside space-y-1 text-brand-subtext text-sm">
                        {item.items.map((point, index) => <li key={index}>{point}</li>)}
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
            <p className="text-brand-subtext text-center max-w-2xl mx-auto">{summary}</p>
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
      basicInfo, environmentalAnalysis, potentialIndex, recommendations, pastCases, recentNews, 
      cityPopulation, schoolEnrollment, pestAnalysis, fiveForcesAnalysis, internalHealthMetrics, swotAnalysis, schoolHealthIndex 
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
            </Section>
        </div>
        <div className="space-y-6">
             <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 h-full flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-center text-brand-text">3. 潛力指標 (CPI)</h3>
                  <CpiGauge score={potentialIndex.cpiScore} />
                </div>
                <p className="text-center text-brand-subtext mt-2 px-2">{potentialIndex.summary}</p>
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
    { condition: true, component: <Section title="外部宏觀環境 (PEST) 分析" icon={<GlobeIcon className="w-6 h-6"/>}><PestAnalysisDisplay data={pestAnalysis} /></Section> },
    { condition: true, component: <Section title="產業競爭環境 (Five Forces) 分析" icon={<ShieldIcon className="w-6 h-6"/>}><FiveForcesAnalysisChart data={fiveForcesAnalysis} /></Section> },
    { condition: true, component: <Section title="內部營運健康度指標" icon={<ClipboardListIcon className="w-6 h-6"/>}><InternalHealthDisplay data={internalHealthMetrics} /></Section> },
    { condition: true, component: <Section title="策略定位 (SWOT) 整合分析" icon={<PuzzleIcon className="w-6 h-6"/>}><SwotAnalysisDisplay data={swotAnalysis} /></Section> },
    { condition: true, component: <Section title="綜合評估健康指數" icon={<HeartbeatIcon className="w-6 h-6"/>}><SchoolHealthIndexGauge data={schoolHealthIndex} /></Section> },
    { condition: true, component: (
        <Section title="建議活化方向" icon={<LightbulbIcon className="w-6 h-6"/>}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendations.map((rec, index) => (
                    <div key={index} className="bg-teal-900/20 p-5 rounded-lg border border-teal-800/50 transform hover:scale-105 hover:border-teal-700 transition-all duration-300">
                        <div className="flex items-center mb-3">
                            <LightbulbIcon className="w-6 h-6 text-amber-300 mr-3"/>
                            <h4 className="font-bold text-lg text-brand-text">{rec.title}</h4>
                        </div>
                        <p className="text-brand-subtext text-sm mb-3">{rec.description}</p>
                        <p className="text-xs text-brand-accent bg-teal-500/10 p-2 rounded-md"><span className="font-semibold">理由：</span>{rec.reason}</p>
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
                        <div className="text-sm space-y-2 text-brand-subtext">
                            <p><span className="font-semibold text-zinc-400">原始條件：</span>{pcase.originalCondition}</p>
                            <p><span className="font-semibold text-zinc-400">活化主題：</span><span className="font-semibold text-amber-400">{pcase.revitalizationTheme}</span></p>
                            <p><span className="font-semibold text-zinc-400">最終成果：</span>{pcase.outcome}</p>
                        </div>
                    </div>
                ))}
            </div>
        </Section>
    )},
  ];

  let visibleSectionCounter = 3;

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
        
      {sections.map((section, index) => {
          if (!section.condition) return null;
          
          if (index > 0) {
            visibleSectionCounter++;
          }
          
          // Inject dynamic section numbers into titles
          if (typeof section.component.props.title === 'string' && index > 0) {
            const newTitle = `${visibleSectionCounter}. ${section.component.props.title}`;
            return React.cloneElement(section.component, { key: index, title: newTitle });
          }
          
          return React.cloneElement(section.component, { key: index });
      })}
    </div>
  );
};
