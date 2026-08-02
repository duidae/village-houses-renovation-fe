
import React, { useState, useCallback, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
//import { fetchAnalysisData } from './services/geminiService';
import type { AnalysisData, CacheEntry, SearchHistoryItem } from './types';
import { AnalysisDashboard } from './components/AnalysisDashboard';
import { LoadingSpinner } from './components/LoadingSpinner';
import { DownloadIcon, HistoryIcon } from './components/icons';
import MapBlock from './components/MapBlock';
import FiveForces from './components/FiveForces';

// Vite: resolve static asset URL so it is included in production build
const twSvgUrl = new URL('./tw.svg', import.meta.url).href;

const CACHE_PREFIX = 'reschool_cache_';
const CACHE_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

const App: React.FC = () => {
  const [schoolName, setSchoolName] = useState<string>('');
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
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
              // Clean up expired cache item
              localStorage.removeItem(key);
            }
          }
        } catch (e) {
          console.error("Error parsing cache item:", e);
          if(key) localStorage.removeItem(key); // Remove corrupted item
        }
      }
    }
    // Sort by most recent
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

    // Check cache first
    const cacheKey = CACHE_PREFIX + trimmedSchoolName;
    const cachedItem = localStorage.getItem(cacheKey);
    if (cachedItem) {
      try {
        const entry: CacheEntry = JSON.parse(cachedItem);
        if (Date.now() - entry.timestamp < CACHE_DURATION_MS) {
          console.log(`Loading "${trimmedSchoolName}" from cache.`);
          setAnalysisData(entry.data);
          setIsLoading(false);
          // Update timestamp to make it the most recent
          entry.timestamp = Date.now();
          localStorage.setItem(cacheKey, JSON.stringify(entry));
          loadSearchHistory(); // Refresh history order
          return;
        } else {
            localStorage.removeItem(cacheKey); // Expired
        }
      } catch(e) {
          console.error("Error parsing cache, fetching fresh data:", e);
          localStorage.removeItem(cacheKey); // Corrupted
      }
    }

    // If not in cache or expired, fetch from API
    /*
    try {
      const data = await fetchAnalysisData(trimmedSchoolName);
      setAnalysisData(data);
      // Save to cache
      const newCacheEntry: CacheEntry = {
        data: data,
        timestamp: Date.now(),
      };
      localStorage.setItem(cacheKey, JSON.stringify(newCacheEntry));
      loadSearchHistory(); // Update history list
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

  const exampleSchools = [
    "嘉義好宅1",
    "嘉義好宅2",
    "嘉義好宅3",
    "嘉義好宅4",
  ];

  const handleHistoryOrExampleClick = (school: string) => {
    setSchoolName(school);
    handleSearch(school);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const handleDownloadPdf = async () => {
    const reportElement = document.getElementById('analysis-report');
    if (!reportElement || !analysisData) return;

    setIsGeneratingPdf(true);
    try {
        const canvas = await html2canvas(reportElement, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#09090b',
            onclone: (document) => {
                document.body.style.backgroundColor = '#ffffff';
            }
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
        console.error("Error generating PDF:", err);
        setError("無法生成 PDF 報告，請稍後再試。");
    } finally {
        setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-brand-text font-sans">
      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="mt-10">
          {isLoading && <LoadingSpinner />}
          {error && <div className="text-center text-red-700 bg-red-100 p-4 rounded-lg max-w-2xl mx-auto border border-red-200">{error}</div>}
          {analysisData && <AnalysisDashboard id="analysis-report" data={analysisData} />}
          {!analysisData && !isLoading && !error && (
            <section className="mt-10 grid gap-8">
              <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-2xl">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.08),_transparent_20%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.07),_transparent_24%)] pointer-events-none" />
                <div className="relative">
                  <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
                    <div className="max-w-2xl">
                      <p className="text-sm uppercase tracking-[0.32em] text-brand-accent/80 mb-3">農村好宅整建活化平台</p>
                      <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight">農村好##</h2>
                      <p className="mt-4 text-slate-600 max-w-2xl">輸入地點或宅院名稱，並以區位、建築條件與再利用方向篩選，快速找到最具價值的活化標的。</p>
                    </div>
                    <div className="w-full lg:w-[420px]">
                      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-inner">
                        <label className="block text-sm font-medium text-slate-700 mb-3">搜尋農村好宅</label>
                        <div className="flex gap-3">
                          <input
                            type="text"
                            value={schoolName}
                            onChange={(e) => setSchoolName(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="輸入縣市、村里或宅院名稱"
                            className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                          />
                          <button
                            onClick={() => handleSearch()}
                            disabled={isLoading || isGeneratingPdf}
                            className="rounded-2xl bg-brand-secondary px-5 py-3 text-white font-semibold transition hover:bg-teal-500 disabled:opacity-60"
                          >
                            搜尋
                          </button>
                        </div>
                        <div className="mt-4 text-xs text-slate-500">可輸入範例：嘉義好宅1、嘉義好宅2。</div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 grid gap-4 lg:grid-cols-4">
                    <div className="rounded-3xl border border-slate-200 bg-white p-5">
                      <label className="block text-sm font-semibold text-slate-900 uppercase tracking-[0.15em] mb-4">整建潛力</label>
                      <select
                        value={selectedPotential}
                        onChange={(e) => setSelectedPotential(e.target.value as '高' | '中' | '低')}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                      >
                        <option value="高">高</option>
                        <option value="中">中</option>
                        <option value="低">低</option>
                      </select>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-5">
                      <label className="block text-sm font-semibold text-slate-900 uppercase tracking-[0.15em] mb-4">區位與生活機能</label>
                      <select
                        value={selectedLocation}
                        onChange={(e) => setSelectedLocation(e.target.value as '主幹道上' | '周邊有公共設施')}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                      >
                        <option value="主幹道上">主幹道上</option>
                        <option value="周邊有公共設施">周邊有公共設施</option>
                      </select>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-5">
                      <label className="block text-sm font-semibold text-slate-900 uppercase tracking-[0.15em] mb-4">建築條件</label>
                      <select
                        value={selectedBuilding}
                        onChange={(e) => setSelectedBuilding(e.target.value as '一條龍' | '單伸手' | '三合院' | '水泥連棟式' | '具歷史價值')}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                      >
                        <option value="一條龍">一條龍</option>
                        <option value="單伸手">單伸手</option>
                        <option value="三合院">三合院</option>
                        <option value="水泥連棟式">水泥連棟式</option>
                        <option value="具歷史價值">具歷史價值</option>
                      </select>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-5">
                      <label className="block text-sm font-semibold text-slate-900 uppercase tracking-[0.15em] mb-4">再利用類型方向</label>
                      <select
                        value={selectedReuse}
                        onChange={(e) => setSelectedReuse(e.target.value as '綠色照顧據點' | '戶外開放空間' | '地方文化展示館' | '農村體驗空間' | '青年創業基地')}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                      >
                        <option value="綠色照顧據點">綠色照顧據點</option>
                        <option value="戶外開放空間">戶外開放空間</option>
                        <option value="地方文化展示館">地方文化展示館</option>
                        <option value="農村體驗空間">農村體驗空間</option>
                        <option value="青年創業基地">青年創業基地</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>

        <MapBlock />
      </main>
    </div>
  );
};

export default App;
