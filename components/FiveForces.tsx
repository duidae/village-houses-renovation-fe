import React from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';

interface Force {
  title: string;
  icon: string;
  description: string;
  factors: string[];
  impact: 'high' | 'medium' | 'low';
}

const FiveForces: React.FC = () => {
  const forces: Force[] = [
    {
      title: '新進入者的威脅',
      icon: '🚀',
      description: '新興的村落整建項目和參與者進入市場',
      factors: [
        '政府補助政策吸引新投資者',
        '低進入門檻鼓勵創新項目',
        '社會責任需求增加參與者',
        '技術進步降低實施成本',
      ],
      impact: 'high',
    },
    {
      title: '供應商的議價力',
      icon: '🏗️',
      description: '建築材料、工程隊伍及設計服務提供商的影響力',
      factors: [
        '優質工匠短缺提高成本',
        '特殊環保材料供應有限',
        '地域性承包商議價能力強',
        '勞動力成本持續上升',
      ],
      impact: 'high',
    },
    {
      title: '買方的議價力',
      icon: '👥',
      description: '房屋所有者和投資者對項目的談判能力',
      factors: [
        '房主對補助條件的選擇性',
        '多個項目可選導致競爭',
        '對品質和成本的高要求',
        '融資選項多樣性',
      ],
      impact: 'medium',
    },
    {
      title: '替代方案的威脅',
      icon: '🔄',
      description: '其他解決方案對傳統整建的替代',
      factors: [
        '新建房屋作為替代選擇',
        '都市遷移政策提供搬遷補助',
        '智能家居改造作為替代',
        '社區共居模式興起',
      ],
      impact: 'medium',
    },
    {
      title: '同業競爭程度',
      icon: '⚔️',
      description: '現有參與者之間的競爭激烈程度',
      factors: [
        '不同項目方爭奪相同資源',
        '技術創新提高項目差異性',
        '聲譽和品牌效應競爭',
        '政府標案競爭激烈',
      ],
      impact: 'high',
    },
  ];

  // Compute numeric score per force and convert to chart data
  const radarData = forces.map((force) => {
    const base = force.impact === 'high' ? 85 : force.impact === 'medium' ? 60 : 35;
    // Slightly adjust score based on number of listed factors (more factors -> slightly higher score)
    const factorBonus = Math.min(10, Math.max(0, (force.factors.length - 3) * 3));
    const value = Math.min(100, Math.max(0, Math.round(base + factorBonus)));
    return {
      name: force.title.substring(0, 8), // Shorten for display
      value,
      fullName: force.title,
    };
  });

  // Bar chart uses full names so labels are clearer
  const barData = radarData.map((d) => ({ name: d.fullName, value: d.value }));

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'border-red-500 bg-red-500/10';
      case 'medium':
        return 'border-yellow-500 bg-yellow-500/10';
      case 'low':
        return 'border-green-500 bg-green-500/10';
      default:
        return 'border-zinc-600 bg-zinc-600/10';
    }
  };

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case 'high':
        return { text: '高風險', color: 'bg-red-600' };
      case 'medium':
        return { text: '中等風險', color: 'bg-yellow-600' };
      case 'low':
        return { text: '低風險', color: 'bg-green-600' };
      default:
        return { text: '未知', color: 'bg-zinc-600' };
    }
  };

  return (
    <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800 mt-10">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-brand-text mb-2 flex items-center">
          📊 波特五力分析
        </h2>
        <p className="text-brand-subtext">村落整建產業的競爭力、威脅與機會分析</p>
      </div>

      {/* Center Competitive Rivalry */}
      <div className="mb-8 flex justify-center">
        <div className="w-full max-w-2xl">
          <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 p-6 rounded-lg border-2 border-brand-accent shadow-lg">
            <p className="text-center text-xs font-bold text-brand-accent uppercase mb-2">
              競爭力五邊形分析
            </p>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart
                data={radarData}
                margin={{ top: 20, right: 80, bottom: 20, left: 80 }}
              >
                <defs>
                  <linearGradient id="colorRadar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <PolarGrid stroke="#404040" />
                <PolarAngleAxis
                  dataKey="name"
                  tick={{
                    fontSize: 12,
                    fill: '#a1a1aa',
                  }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: '#71717a' }}
                />
                <Radar
                  name="影響力強度"
                  dataKey="value"
                  stroke="#14b8a6"
                  fill="url(#colorRadar)"
                  fillOpacity={0.6}
                  isAnimationActive={true}
                />
              </RadarChart>
            </ResponsiveContainer>
            {/* Score bar chart (compact) */}
            <div className="mt-6">
              <p className="text-center text-xs font-bold text-brand-accent uppercase mb-2">每項力量得分</p>
              <div className="w-full h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={barData} margin={{ top: 6, right: 12, left: 12, bottom: 6 }}>
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12, fill: '#a1a1aa' }} />
                    <Tooltip formatter={(value: number) => `${value}%`} />
                    <Bar dataKey="value" barSize={12} isAnimationActive={true}>
                      {barData.map((entry, idx) => {
                        const impact = forces[idx].impact;
                        const color = impact === 'high' ? '#ef4444' : impact === 'medium' ? '#f59e0b' : '#10b981';
                        return <Cell key={`cell-${idx}`} fill={color} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <p className="text-center text-sm text-brand-subtext mt-4">
              五邊形面積越大，表示該力量對市場的影響力越強
            </p>
          </div>
        </div>
      </div>

      {/* Five Forces Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {forces.map((force, index) => {
          const badgeStyle = getImpactBadge(force.impact);
          const borderStyle = getImpactColor(force.impact);
          const score = radarData[index]?.value ?? (force.impact === 'high' ? 85 : force.impact === 'medium' ? 60 : 35);

          return (
            <div
              key={index}
              className={`p-5 rounded-lg border-2 ${borderStyle} transition-all hover:shadow-lg hover:scale-105`}
            >
              {/* Icon and Title */}
              <div className="flex items-start justify-between mb-3">
                <span className="text-3xl">{force.icon}</span>
                <div className="flex flex-col items-end gap-2">
                  <span className={`text-xs font-bold text-white px-2 py-1 rounded ${badgeStyle.color}`}>
                    {badgeStyle.text}
                  </span>
                  <span className="text-xs font-mono text-brand-accent bg-zinc-800/60 px-2 py-0.5 rounded">
                    {score}%
                  </span>
                </div>
              </div>

              <h3 className="font-bold text-brand-text text-sm mb-2">
                {force.title}
              </h3>
              <p className="text-xs text-brand-subtext mb-3 leading-relaxed">
                {force.description}
              </p>

              {/* Factors */}
              <div className="space-y-1">
                <p className="text-xs font-semibold text-brand-accent uppercase">
                  關鍵因素：
                </p>
                {force.factors.map((factor, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-brand-accent text-xs flex-shrink-0 mt-0.5">
                      •
                    </span>
                    <span className="text-xs text-brand-text/80 leading-tight">
                      {factor}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-zinc-800/70 p-4 rounded-lg border border-zinc-700">
          <p className="text-xs font-bold text-brand-accent mb-2 uppercase">
            主要機會
          </p>
          <ul className="space-y-2 text-sm text-brand-text/80">
            <li>✓ 政府支持政策提供資金機會</li>
            <li>✓ 社會永續發展需求增長</li>
            <li>✓ 創新技術降低成本</li>
          </ul>
        </div>

        <div className="bg-zinc-800/70 p-4 rounded-lg border border-zinc-700">
          <p className="text-xs font-bold text-brand-accent mb-2 uppercase">
            主要威脅
          </p>
          <ul className="space-y-2 text-sm text-brand-text/80">
            <li>⚠ 日益增加的競爭對手</li>
            <li>⚠ 供應商成本上升</li>
            <li>⚠ 替代方案的出現</li>
          </ul>
        </div>

        <div className="bg-zinc-800/70 p-4 rounded-lg border border-zinc-700">
          <p className="text-xs font-bold text-brand-accent mb-2 uppercase">
            建議策略
          </p>
          <ul className="space-y-2 text-sm text-brand-text/80">
            <li>1. 建立品牌差異性</li>
            <li>2. 優化供應鏈管理</li>
            <li>3. 提高客戶滿意度</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default FiveForces;
