
import React, { useState, useCallback, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
//import { fetchAnalysisData } from './services/geminiService';
import type { AnalysisData, CacheEntry, SearchHistoryItem } from './types';
import { AnalysisDashboard } from './components/AnalysisDashboard';
import { LoadingSpinner } from './components/LoadingSpinner';
import { DownloadIcon, HistoryIcon } from './components/icons';
import MapBlock from './components/MapBlock';

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
    <div className="min-h-screen bg-zinc-950 text-brand-text font-sans">
      <main className="container mx-auto px-4 py-8 md:py-12">
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

        <div className="mt-10">
          {isLoading && <LoadingSpinner />}
          {error && <div className="text-center text-red-400 bg-red-900/50 p-4 rounded-lg max-w-2xl mx-auto border border-red-800">{error}</div>}
          {analysisData && <AnalysisDashboard id="analysis-report" data={analysisData} />}
          {false && !isLoading && !error && !analysisData && (
            <div className="text-center text-brand-subtext max-w-2xl mx-auto mt-16 flex flex-col items-center">
                <img height="400" width="400" src={twSvgUrl} alt="My SVG image" />
                <h2 className="text-2xl font-semibold text-brand-text mb-2">準備好探索校園新潛力了嗎？</h2>
                <p>輸入一所學校的名稱，ReSchool 將為您生成一份完整的地理潛力分析報告，包含校地資訊、環境評估、潛力指數與活化建議，為您的決策提供數據支持。</p>
            </div>
          )}
        </div>

        <MapBlock />

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
