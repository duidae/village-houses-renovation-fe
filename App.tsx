
import React, { useState, useCallback, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { AnalysisData, CacheEntry, SearchHistoryItem } from './types';
import { AnalysisDashboard } from './components/AnalysisDashboard';
import { LoadingSpinner } from './components/LoadingSpinner';
import MapBlock from './components/MapBlock';
import FiveForces from './components/FiveForces';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';

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
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.100', color: 'text.primary', py: 2 }}>
      <Container maxWidth="lg">
        {isLoading && <LoadingSpinner />}

        {error && (
          <Alert severity="error" sx={{ mb: 4 }}>
            {error}
          </Alert>
        )}

        {analysisData ? (
          <AnalysisDashboard id="analysis-report" data={analysisData} />
        ) : (
          <Card sx={{ position: 'relative', overflow: 'hidden', bgcolor: 'background.paper', boxShadow: 5, borderRadius: 4, p: 3, mb: 1 }}>
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                bgcolor: 'transparent',
                backgroundImage:
                  'radial-gradient(circle at top left, rgba(59,130,246,0.08), transparent 20%), radial-gradient(circle at bottom right, rgba(16,185,129,0.05), transparent 24%)',
                pointerEvents: 'none',
              }}
            />

            <CardContent sx={{ position: 'relative' }}>
              <Grid container spacing={4} alignItems="flex-start">
                <Grid item xs={12} md={7}>
                  <Typography variant="overline" component="p" sx={{ letterSpacing: 2, mb: 2, color: 'primary.main' }}>
                    農村好宅整建活化平台
                  </Typography>
                  <Typography variant="h3" component="h1" sx={{ fontWeight: 800, mb: 2 }}>
                    農村好##
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 650 }}>
                    輸入地點或宅院名稱，並以區位、建築條件與再利用方向篩選，快速找到最具價值的活化標的。
                  </Typography>
                </Grid>

                <Grid item xs={12} md={5}>
                  <Card sx={{ bgcolor: 'grey.100', boxShadow: 'none', borderRadius: 3 }}>
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                        搜尋農村好宅
                      </Typography>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <TextField
                          fullWidth
                          value={schoolName}
                          onChange={(e) => setSchoolName(e.target.value)}
                          onKeyDown={handleKeyPress}
                          placeholder="輸入縣市、村里或宅院名稱"
                          variant="outlined"
                        />
                        <Button
                          variant="contained"
                          size="large"
                          onClick={() => handleSearch()}
                          disabled={isLoading || isGeneratingPdf}
                        >
                          搜尋
                        </Button>
                      </Stack>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                        可輸入範例：嘉義好宅1、嘉義好宅2。
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Grid container spacing={3} sx={{ mt: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth sx={{ bgcolor: 'background.paper', borderRadius: 3 }}>
                    <InputLabel>整建潛力</InputLabel>
                    <Select
                      value={selectedPotential}
                      label="整建潛力"
                      onChange={(e) => setSelectedPotential(e.target.value as '高' | '中' | '低')}
                    >
                      <MenuItem value="高">高</MenuItem>
                      <MenuItem value="中">中</MenuItem>
                      <MenuItem value="低">低</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth sx={{ bgcolor: 'background.paper', borderRadius: 3 }}>
                    <InputLabel>區位與生活機能</InputLabel>
                    <Select
                      value={selectedLocation}
                      label="區位與生活機能"
                      onChange={(e) => setSelectedLocation(e.target.value as '主幹道上' | '周邊有公共設施')}
                    >
                      <MenuItem value="主幹道上">主幹道上</MenuItem>
                      <MenuItem value="周邊有公共設施">周邊有公共設施</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth sx={{ bgcolor: 'background.paper', borderRadius: 3 }}>
                    <InputLabel>建築條件</InputLabel>
                    <Select
                      value={selectedBuilding}
                      label="建築條件"
                      onChange={(e) =>
                        setSelectedBuilding(
                          e.target.value as '一條龍' | '單伸手' | '三合院' | '水泥連棟式' | '具歷史價值'
                        )
                      }
                    >
                      <MenuItem value="一條龍">一條龍</MenuItem>
                      <MenuItem value="單伸手">單伸手</MenuItem>
                      <MenuItem value="三合院">三合院</MenuItem>
                      <MenuItem value="水泥連棟式">水泥連棟式</MenuItem>
                      <MenuItem value="具歷史價值">具歷史價值</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth sx={{ bgcolor: 'background.paper', borderRadius: 3 }}>
                    <InputLabel>再利用類型方向</InputLabel>
                    <Select
                      value={selectedReuse}
                      label="再利用類型方向"
                      onChange={(e) =>
                        setSelectedReuse(
                          e.target.value as
                            | '綠色照顧據點'
                            | '戶外開放空間'
                            | '地方文化展示館'
                            | '農村體驗空間'
                            | '青年創業基地'
                        )
                      }
                    >
                      <MenuItem value="綠色照顧據點">綠色照顧據點</MenuItem>
                      <MenuItem value="戶外開放空間">戶外開放空間</MenuItem>
                      <MenuItem value="地方文化展示館">地方文化展示館</MenuItem>
                      <MenuItem value="農村體驗空間">農村體驗空間</MenuItem>
                      <MenuItem value="青年創業基地">青年創業基地</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
            <MapBlock />
          </Card>
        )}
      </Container>
    </Box>
  );
};

export default App;
