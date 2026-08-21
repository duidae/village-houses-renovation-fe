
import React, { useState, useCallback, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { AnalysisData, CacheEntry, SearchHistoryItem } from './types';
import HomePage from './components/HomePage';
import CaseAnalysisPage from './components/CaseAnalysisPage';
import { Routes, Route, Navigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';

const CACHE_PREFIX = 'reschool_cache_';
const CACHE_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

const mockAnalysisData: AnalysisData = {
  basicInfo: {
    name: '嘉義好宅範例',
    address: '嘉義市示範路 1 號',
    foundedYear: 1978,
    areaSqM: 840,
    buildingCoverage: 45,
    latitude: 23.4793,
    longitude: 120.4499,
  },
  environmentalAnalysis: {
    terrain: '平坦地形，鄰近田野與小溪',
    avgElevationM: 32,
    coastDistanceKm: 15,
    riverDistanceKm: 1.2,
    nearestStation: '嘉義火車站',
    transportationScore: 75,
    localAttractions: ['文化公園', '農村市集'],
    localSpecialtyFoods: ['檜木炭火雞', '紅茶蛋糕'],
  },
  potentialIndex: {
    cpiScore: 82,
    summary: '地點條件優良，轉型潛力高。',
  },
  recommendations: [
    {
      title: '轉型綠色照顧基地',
      description: '建議將建築活化為複合長照與社區交流空間。',
      reason: '鄰近醫療與公共交通，可串聯地方資源。',
    },
  ],
  strategicRecommendations: [
    {
      type: '社會需求型',
      project: '地方社區照顧中心',
      reason: '滿足在地長者日間照顧與服務需求。',
      policyAlignment: ['長照2.0', '地方創生'],
    },
  ],
  impactAssessment: {
    economic: [{ metric: '就業機會', value: '中', description: '可創造在地服務職缺。'}],
    social: [{ metric: '社會凝聚力', value: '高', description: '提供社區共用場域。'}],
    sustainability: [{ metric: '節能減碳', value: '中', description: '改造方案包含綠建材。'}],
    summary: '此案具備社會效益與產業轉型潛力。',
  },
  transformationAlternatives: [
    {
      title: '綠色照顧園區',
      description: '規劃長照服務、日照中心與多功能館。',
      alignment: '社區照護',
      potentialImpact: [{ metric: '在地就業', value: '增加 20%', description: '帶動周邊服務需求。'}],
      implementationSteps: ['場域評估', '設計改造', '試營運'],
      keyPartners: ['地方衛生所', '長照機構'],
      riskAnalysis: '需取得地方居民信任與穩定經費來源。',
    },
  ],
  pastCases: [
    {
      schoolName: '台南好宅',
      location: '台南市中心',
      originalCondition: '閒置校舍',
      revitalizationTheme: '老屋再生',
      outcome: '成功轉型為社區日照中心',
    },
  ],
  recentNews: {
    schoolNews: [{ title: '好宅案啟動', summary: '正式啟動社區活化計畫。', date: '2026-08-06' }],
    cityNews: [{ title: '地方創生補助', summary: '市府發布新一輪補助方案。', date: '2026-07-30' }],
  },
  cityPopulation: [
    { year: 2020, population: 271000 },
    { year: 2025, population: 265000 },
  ],
  schoolEnrollment: [
    { year: 2020, studentCount: 180 },
    { year: 2025, studentCount: 150 },
  ],
  trendProjection: {
    projectionData: [
      { year: 2026, projectedPopulation: 262000, projectedStudentCount: 145 },
      { year: 2030, projectedPopulation: 255000, projectedStudentCount: 130 },
    ],
    analysis: '人口持續下降，教育與照護需求呈現轉型趨勢。',
  },
  pestAnalysis: {
    political: '政府積極推動地方創生。',
    economic: '農業與觀光並重。',
    social: '高齡化趨勢明顯。',
    technological: '智慧照護技術成熟度提高。',
  },
  fiveForcesAnalysis: {
    industryRivalry: { score: 3, analysis: '同類社區照護服務數量穩定。' },
    threatOfNewEntrants: { score: 2, analysis: '補助門檻較高，新進者有限。' },
    bargainingPowerOfBuyers: { score: 4, analysis: '需求端集中且重視品質。' },
    bargainingPowerOfSuppliers: { score: 3, analysis: '地方人力與材料供應穩定。' },
    threatOfSubstituteProducts: { score: 3, analysis: '其他照護方案存在，但本案具在地優勢。' },
  },
  internalHealthMetrics: {
    enrollment: [{ metric: '入學率', value: '72%', analysis: '略低於區域平均。' }],
    financial: [{ metric: '營收穩定度', value: '中', analysis: '需提高多元收益。'}],
    brand: [{ metric: '知名度', value: '低', analysis: '仍需擴大宣傳。'}],
    operational: [{ metric: '維運效率', value: '中', analysis: '改造後可提升服務品質。'}],
  },
  swotAnalysis: {
    strengths: ['地點優勢', '管理團隊經驗'],
    weaknesses: ['資金短缺', '品牌能見度低'],
    opportunities: ['補助政策', '銀髮市場成長'],
    threats: ['市場競爭', '人口流失'],
  },
};

const App: React.FC = () => {
  const [schoolName, setSchoolName] = useState<string>('');
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [selectedResearchBase, setSelectedResearchBase] = useState<
    '全部' | '嘉義好宅1' | '嘉義好宅2' | '嘉義好宅3' | '嘉義好宅4'
  >('全部');
  const [selectedPotential, setSelectedPotential] = useState<'高' | '中' | '低'>('中');
  const [selectedLocation, setSelectedLocation] = useState<'主幹道上' | '周邊有公共設施'>('主幹道上');
  const [selectedBuilding, setSelectedBuilding] = useState<'一條龍' | '單伸手' | '三合院' | '水泥連棟式' | '具歷史價值'>('一條龍');
  const [selectedReuse, setSelectedReuse] = useState<'綠色照顧據點' | '戶外開放空間' | '地方文化展示館' | '農村體驗空間' | '青年創業基地'>('綠色照顧據點');

  const loadSearchHistory = useCallback(() => {
    const history: SearchHistoryItem[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_PREFIX)) {
        try {
          const item = localStorage.getItem(key);
          if (item) {
            const entry: CacheEntry = JSON.parse(item);
            if (Date.now() - entry.timestamp < CACHE_DURATION_MS) {
              history.push({
                schoolName: key.replace(CACHE_PREFIX, ''),
                date: new Date(entry.timestamp).toLocaleDateString(),
              });
            } else {
              localStorage.removeItem(key);
            }
          }
        } catch (e) {
          console.error('Error parsing cache item:', e);
          if (key) localStorage.removeItem(key);
        }
      }
    }

    history.sort((a, b) => {
      const aEntryItem = localStorage.getItem(CACHE_PREFIX + a.schoolName);
      const bEntryItem = localStorage.getItem(CACHE_PREFIX + b.schoolName);
      if (!aEntryItem || !bEntryItem) return 0;
      const aEntry = JSON.parse(aEntryItem);
      const bEntry = JSON.parse(bEntryItem);
      return (bEntry.timestamp || 0) - (aEntry.timestamp || 0);
    });

    setSearchHistory(history);
  }, []);

  useEffect(() => {
    loadSearchHistory();
  }, [loadSearchHistory]);

  const handleSearch = useCallback(async (searchSchoolName?: string) => {
    const trimmedSchoolName = (searchSchoolName || schoolName).trim();
    if (!trimmedSchoolName) {
      setError('請輸入學校名稱。');
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnalysisData(null);

    const cacheKey = CACHE_PREFIX + trimmedSchoolName;
    const cachedItem = localStorage.getItem(cacheKey);

    if (cachedItem) {
      try {
        const entry: CacheEntry = JSON.parse(cachedItem);
        if (Date.now() - entry.timestamp < CACHE_DURATION_MS) {
          setAnalysisData(entry.data);
          setIsLoading(false);
          entry.timestamp = Date.now();
          localStorage.setItem(cacheKey, JSON.stringify(entry));
          loadSearchHistory();
          return;
        }
        localStorage.removeItem(cacheKey);
      } catch (e) {
        console.error('Error parsing cache, fetching fresh data:', e);
        localStorage.removeItem(cacheKey);
      }
    }

    /*
    try {
      const data = await fetchAnalysisData(trimmedSchoolName);
      setAnalysisData(data);
      const newCacheEntry: CacheEntry = {
        data,
        timestamp: Date.now(),
      };
      localStorage.setItem(cacheKey, JSON.stringify(newCacheEntry));
      loadSearchHistory();
    } catch (err: any) {
      setError(err.message || '發生未知錯誤。');
    } finally {
      setIsLoading(false);
    }
    */
  }, [schoolName, loadSearchHistory]);

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  const exampleSchools = ['嘉義好宅1', '嘉義好宅2', '嘉義好宅3', '嘉義好宅4'];

  const handleHistoryOrExampleClick = (school: string) => {
    setSchoolName(school);
    handleSearch(school);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDownloadPdf = async () => {
    const reportElement = document.getElementById('analysis-report');
    if (!reportElement || !analysisData) return;

    setIsGeneratingPdf(true);

    try {
      const canvas = await html2canvas(reportElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        onclone: (document) => {
          document.body.style.backgroundColor = '#ffffff';
        },
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const ratio = canvasWidth / pdfWidth;
      const scaledCanvasHeight = canvasHeight / ratio;

      let heightLeft = scaledCanvasHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, scaledCanvasHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = position - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, scaledCanvasHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(`ReSchool 分析報告 - ${analysisData.basicInfo.name}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('無法生成 PDF 報告，請稍後再試。');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (

  <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'grey.100', color: 'text.primary', py: 2 }}>
    <Container maxWidth={false} disableGutters sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              isLoading={isLoading}
              error={error}
              analysisData={analysisData}
              schoolName={schoolName}
              setSchoolName={setSchoolName}
              handleSearch={handleSearch}
              handleKeyPress={handleKeyPress}
              isGeneratingPdf={isGeneratingPdf}
              selectedResearchBase={selectedResearchBase}
              setSelectedResearchBase={setSelectedResearchBase}
              selectedPotential={selectedPotential}
              setSelectedPotential={setSelectedPotential}
              selectedLocation={selectedLocation}
              setSelectedLocation={setSelectedLocation}
              selectedBuilding={selectedBuilding}
              setSelectedBuilding={setSelectedBuilding}
              selectedReuse={selectedReuse}
              setSelectedReuse={setSelectedReuse}
            />
          }
        />
        <Route path="/analysis/case" element={<CaseAnalysisPage analysisData={analysisData ?? mockAnalysisData} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Container>
  </Box>
);
};

export default App;

