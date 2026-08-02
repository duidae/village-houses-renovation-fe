
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
                document.body.style.backgroundColor = '#09090b';
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
        {/*
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 to-zinc-400 mb-2">
            ReVillage
          </h1>
          <p className="text-lg text-brand-subtext">農村個別宅院整建潛能分析平台</p>
        </header>

        
        <div className="bg-zinc-900/50 p-4 sm:p-6 rounded-xl shadow-lg border border-zinc-800 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="請輸入農村好宅..."
              className="flex-grow bg-zinc-800 border border-zinc-700 rounded-md py-3 px-4 text-brand-text placeholder-brand-subtext/70 focus:ring-2 focus:ring-brand-accent focus:outline-none transition"
              disabled={isLoading || isGeneratingPdf}
            />
            <button
              id="search-button"
              onClick={() => handleSearch()}
              disabled={isLoading || isGeneratingPdf}
              className="bg-brand-secondary hover:bg-teal-500 text-white font-bold py-3 px-6 rounded-md transition-colors duration-300 disabled:bg-zinc-700 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  分析中...
                </>
              ) : '開始分析'}
            </button>
          </div>
          <div className="text-center mt-4">
            <p className="text-sm text-brand-subtext">或試試範例：</p>
            <div className="flex flex-wrap justify-center gap-2 mt-2">
                {exampleSchools.map(school => (
                    <button
                        key={school}
                        onClick={() => handleHistoryOrExampleClick(school)}
                        disabled={isLoading || isGeneratingPdf}
                        className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-1 px-3 rounded-full transition-colors disabled:opacity-50">
                        {school}
                    </button>
                ))}
            </div>
          </div>
        </div>
        */}

        <div className="mt-10">
          {isLoading && <LoadingSpinner />}
          {error && <div className="text-center text-red-400 bg-red-900/50 p-4 rounded-lg max-w-2xl mx-auto border border-red-800">{error}</div>}
          {analysisData && <AnalysisDashboard id="analysis-report" data={analysisData} />}
          {!analysisData && !isLoading && !error && (
            <section className="mt-10 grid gap-8">
              <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-2xl">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.16),_transparent_20%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.14),_transparent_24%)] pointer-events-none" />
                <div className="relative">
                  <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
                    <div className="max-w-2xl">
                      <p className="text-sm uppercase tracking-[0.32em] text-brand-accent/80 mb-3">農村好宅整建活化平台</p>
                      <h2 className="text-4xl md:text-5xl font-extrabold text-white leading-tight">農村好##</h2>
                      <p className="mt-4 text-zinc-300 max-w-2xl">輸入地點或宅院名稱，並以區位、建築條件與再利用方向篩選，快速找到最具價值的活化標的。</p>
                    </div>
                    <div className="w-full lg:w-[420px]">
                      <div className="rounded-3xl border border-zinc-800 bg-zinc-950/90 p-5 shadow-inner">
                        <label className="block text-sm font-medium text-brand-subtext mb-3">搜尋農村好宅</label>
                        <div className="flex gap-3">
                          <input
                            type="text"
                            value={schoolName}
                            onChange={(e) => setSchoolName(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="輸入縣市、村里或宅院名稱"
                            className="flex-1 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-brand-text placeholder-brand-subtext/70 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                          />
                          <button
                            onClick={() => handleSearch()}
                            disabled={isLoading || isGeneratingPdf}
                            className="rounded-2xl bg-brand-secondary px-5 py-3 text-white font-semibold transition hover:bg-teal-500 disabled:opacity-60"
                          >
                            搜尋
                          </button>
                        </div>
                        <div className="mt-4 text-xs text-zinc-400">可輸入範例：嘉義好宅1、嘉義好宅2。</div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 grid gap-4 lg:grid-cols-4">
                    <div className="rounded-3xl border border-zinc-800 bg-zinc-950/90 p-5">
                      <h3 className="text-sm font-semibold text-brand-text uppercase tracking-[0.15em] mb-4">整建潛力</h3>
                      <div className="space-y-2">
                        {['高', '中', '低'].map((option) => (
                          <button
                            key={option}
                            onClick={() => setSelectedPotential(option as '高' | '中' | '低')}
                            className={`w-full rounded-2xl border px-3 py-2 text-left text-sm transition ${selectedPotential === option ? 'border-brand-accent bg-brand-accent/10 text-white' : 'border-zinc-800 text-zinc-300 hover:border-zinc-600'}`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-3xl border border-zinc-800 bg-zinc-950/90 p-5">
                      <h3 className="text-sm font-semibold text-brand-text uppercase tracking-[0.15em] mb-4">區位與生活機能</h3>
                      <div className="space-y-2">
                        {['主幹道上', '周邊有公共設施'].map((option) => (
                          <button
                            key={option}
                            onClick={() => setSelectedLocation(option as '主幹道上' | '周邊有公共設施')}
                            className={`w-full rounded-2xl border px-3 py-2 text-left text-sm transition ${selectedLocation === option ? 'border-brand-accent bg-brand-accent/10 text-white' : 'border-zinc-800 text-zinc-300 hover:border-zinc-600'}`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-3xl border border-zinc-800 bg-zinc-950/90 p-5">
                      <h3 className="text-sm font-semibold text-brand-text uppercase tracking-[0.15em] mb-4">建築條件</h3>
                      <div className="space-y-2">
                        {['一條龍', '單伸手', '三合院', '水泥連棟式', '具歷史價值'].map((option) => (
                          <button
                            key={option}
                            onClick={() => setSelectedBuilding(option as '一條龍' | '單伸手' | '三合院' | '水泥連棟式' | '具歷史價值')}
                            className={`w-full rounded-2xl border px-3 py-2 text-left text-sm transition ${selectedBuilding === option ? 'border-brand-accent bg-brand-accent/10 text-white' : 'border-zinc-800 text-zinc-300 hover:border-zinc-600'}`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-3xl border border-zinc-800 bg-zinc-950/90 p-5">
                      <h3 className="text-sm font-semibold text-brand-text uppercase tracking-[0.15em] mb-4">再利用類型方向</h3>
                      <div className="space-y-2">
                        {['綠色照顧據點', '戶外開放空間', '地方文化展示館', '農村體驗空間', '青年創業基地'].map((option) => (
                          <button
                            key={option}
                            onClick={() => setSelectedReuse(option as '綠色照顧據點' | '戶外開放空間' | '地方文化展示館' | '農村體驗空間' | '青年創業基地')}
                            className={`w-full rounded-2xl border px-3 py-2 text-left text-sm transition ${selectedReuse === option ? 'border-brand-accent bg-brand-accent/10 text-white' : 'border-zinc-800 text-zinc-300 hover:border-zinc-600'}`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

{/*
              <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
                <div className="rounded-3xl border border-zinc-800 bg-zinc-950/90 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-brand-subtext uppercase tracking-[0.2em]">地圖預覽</p>
                      <h3 className="text-xl font-semibold text-brand-text">農村好宅分布</h3>
                    </div>
                    <span className="rounded-full bg-brand-accent/10 text-brand-accent px-3 py-1 text-xs font-semibold">即時搜尋</span>
                  </div>
                  <div className="relative overflow-hidden rounded-3xl bg-zinc-900 h-[320px] border border-zinc-800">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_transparent_20%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.16),_transparent_24%)]" />
                    <div className="absolute inset-0 p-5 flex flex-wrap items-end gap-3">
                      {['高', '中', '低', '高', '中'].map((item, index) => (
                        <span key={index} className={`rounded-full px-3 py-1 text-xs font-semibold ${item === '高' ? 'bg-emerald-500/20 text-emerald-200' : item === '中' ? 'bg-amber-500/20 text-amber-200' : 'bg-zinc-700/60 text-zinc-100'}`}>{item}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-zinc-800 bg-zinc-950/90 p-5">
                  <p className="text-sm font-semibold text-brand-text uppercase tracking-[0.2em] mb-3">使用說明</p>
                  <ul className="space-y-3 text-sm text-zinc-300">
                    <li>1. 輸入縣市、村里或宅院名稱進行搜尋。</li>
                    <li>2. 選擇整建潛力、區位條件與建築類型。</li>
                    <li>3. 指定再利用方向，找到最適合的活化建議。</li>
                    <li>4. 檢視分析結果、下載報告並保存歷史紀錄。</li>
                  </ul>
                  <div className="mt-6 rounded-3xl bg-zinc-900/90 p-4 border border-zinc-800">
                    <p className="text-sm font-semibold text-brand-text mb-2">目前選擇</p>
                    <div className="space-y-2 text-sm text-zinc-300">
                      <p>整建潛力：<span className="text-brand-text">{selectedPotential}</span></p>
                      <p>區位機能：<span className="text-brand-text">{selectedLocation}</span></p>
                      <p>建築條件：<span className="text-brand-text">{selectedBuilding}</span></p>
                      <p>再利用方向：<span className="text-brand-text">{selectedReuse}</span></p>
                    </div>
                  </div>
                </div>
              </div>
              */}
            </section>
          )}
        </div>

        <MapBlock />

        <FiveForces />

        {searchHistory.length > 0 && (
            <div className="mt-12">
                <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800">
                    <h3 className="text-xl font-semibold mb-4 text-brand-text flex items-center">
                        <HistoryIcon className="w-6 h-6 mr-3 text-brand-accent"/>
                        最近搜尋紀錄
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {searchHistory.map(item => (
                        <button
                            key={item.schoolName}
                            onClick={() => handleHistoryOrExampleClick(item.schoolName)}
                            disabled={isLoading || isGeneratingPdf}
                            className="w-full text-left p-4 rounded-lg bg-zinc-800/70 hover:bg-zinc-700/90 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <p className="font-medium text-brand-text text-sm">{item.schoolName}</p>
                            <p className="text-xs text-brand-subtext mt-1">分析日期：{item.date}</p>
                        </button>
                    ))}
                    </div>
                </div>
            </div>
        )}

        {analysisData && !isLoading && (
            <button
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="fixed bottom-6 right-6 z-50 bg-brand-accent hover:bg-teal-300 text-brand-dark font-bold py-3 px-5 rounded-full shadow-lg transform transition-all hover:scale-110 duration-300 disabled:bg-zinc-600 disabled:cursor-wait disabled:scale-100 flex items-center"
                aria-label="下載分析報告"
            >
                {isGeneratingPdf ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        產生中...
                    </>
                ) : (
                    <>
                        <DownloadIcon className="w-5 h-5 mr-2" />
                        下載分析報告
                    </>
                )}
            </button>
        )}
      </main>
    </div>
  );
};

export default App;
