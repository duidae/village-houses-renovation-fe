import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AnalysisData } from '../types';
import { AnalysisDashboard } from './AnalysisDashboard';
import { LoadingSpinner } from './LoadingSpinner';
import MapBlock from './MapBlock';
import { fetchProperties } from '../services/propertiesService';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';
import InputLabel from '@mui/material/InputLabel';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';

interface HomePageProps {
  isLoading: boolean;
  error: string | null;
  analysisData: AnalysisData | null;
  schoolName: string;
  setSchoolName: React.Dispatch<React.SetStateAction<string>>;
  handleSearch: (searchSchoolName?: string) => Promise<void>;
  handleKeyPress: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  isGeneratingPdf: boolean;
  selectedResearchBase: string;
  setSelectedResearchBase: React.Dispatch<React.SetStateAction<string>>;
  selectedPotential: '全部' | '高' | '中' | '低';
  setSelectedPotential: React.Dispatch<React.SetStateAction<'全部' | '高' | '中' | '低'>>;
  selectedLocation: '主幹道上' | '周邊有公共設施';
  setSelectedLocation: React.Dispatch<React.SetStateAction<'主幹道上' | '周邊有公共設施'>>;
  selectedBuilding: '一條龍' | '單伸手' | '三合院' | '水泥連棟式' | '具歷史價值';
  setSelectedBuilding: React.Dispatch<React.SetStateAction<'一條龍' | '單伸手' | '三合院' | '水泥連棟式' | '具歷史價值'>>;
  selectedReuse: '綠色照顧據點' | '戶外開放空間' | '地方文化展示館' | '農村體驗空間' | '青年創業基地';
  setSelectedReuse: React.Dispatch<React.SetStateAction<'綠色照顧據點' | '戶外開放空間' | '地方文化展示館' | '農村體驗空間' | '青年創業基地'>>;
}

const HomePage: React.FC<HomePageProps> = ({
  isLoading,
  error,
  analysisData,
  schoolName,
  setSchoolName,
  handleSearch,
  handleKeyPress,
  isGeneratingPdf,
  selectedResearchBase,
  setSelectedResearchBase,
  selectedPotential,
  setSelectedPotential,
  selectedLocation,
  setSelectedLocation,
  selectedBuilding,
  setSelectedBuilding,
  selectedReuse,
  setSelectedReuse,
}) => {
  const navigate = useNavigate();
  const [houseOptions, setHouseOptions] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetchProperties().then((properties) =>
      setHouseOptions(properties.map((p) => ({ id: p.id, name: p.name })))
    );
  }, []);

  const normalizedSearch = schoolName.trim().replace(/\s+/g, '').toLocaleLowerCase();
  const hasExactMatch = houseOptions.some(
    ({ name }) => name.replace(/\s+/g, '').toLocaleLowerCase() === normalizedSearch
  );
  const matchedHouses = normalizedSearch
    ? houseOptions
        .filter(({ name }) => name.replace(/\s+/g, '').toLocaleLowerCase().includes(normalizedSearch))
        .slice(0, 8)
    : [];

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {isLoading && <LoadingSpinner />}

      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      {analysisData ? (
        <>
          <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
            <Button variant="outlined" onClick={() => navigate('/analysis/case')}>
              查看個案分析
            </Button>
          </Stack>
          <AnalysisDashboard id="analysis-report" data={analysisData} />
        </>
      ) : (
        <Card sx={{ position: 'relative', overflow: 'hidden', bgcolor: 'background.paper', boxShadow: 5, borderRadius: 4, p: 3, mb: 1, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <CardContent sx={{ position: 'relative', py: 2, flexShrink: 0 }}>
            <Grid container spacing={4} alignItems="flex-start">
              <Grid item xs={12} md={6}>
                <Typography variant="overline" component="p" sx={{ fontSize: '20px', letterSpacing: 2, mb: 2, color: 'primary.main' }}>
                  農村好宅整建活化平台
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                  <Box
                    component="img"
                    src="/logo.png"
                    alt="Logo"
                    sx={{ width: 56, height: 56, borderRadius: 2, objectFit: 'contain' }}
                  />
                  <Typography variant="h3" component="h1" sx={{ fontWeight: 800 }}>
                    農村好##
                  </Typography>
                </Box>
                <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 700 }}>
                  輸入地點或宅院名稱，並以區位、建築條件與再利用方向篩選，快速找到最具價值的活化標的。
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card sx={{ bgcolor: 'grey.100', boxShadow: 'none', borderRadius: 3, overflow: 'visible' }}>
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                      搜尋農村好宅
                    </Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                      <Box sx={{ position: 'relative', flex: 1 }}>
                        <TextField
                          fullWidth
                          value={schoolName}
                          onChange={(e) => setSchoolName(e.target.value)}
                          onKeyDown={handleKeyPress}
                          placeholder="輸入縣市、村里或宅院名稱"
                          variant="outlined"
                        />
                        {matchedHouses.length > 0 && !hasExactMatch && (
                          <Paper
                            elevation={4}
                            sx={{ position: 'absolute', zIndex: 2, left: 0, right: 0, mt: 1, maxHeight: 280, overflowY: 'auto' }}
                          >
                            <List disablePadding>
                              {matchedHouses.map((house) => (
                                <ListItemButton
                                  key={house.id}
                                  onClick={() => {
                                    setSchoolName(house.name);
                                    setSelectedResearchBase(house.id);
                                  }}
                                >
                                  {house.name}
                                </ListItemButton>
                              ))}
                            </List>
                          </Paper>
                        )}
                      </Box>
                      <Button
                        variant="contained"
                        size="medium"
                        onClick={() => handleSearch()}
                        disabled={isLoading || isGeneratingPdf}
                      >
                        搜尋
                      </Button>
                    </Stack>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                      可輸入範例：西昌社區、福興社區。
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Grid container spacing={3} sx={{ mt: 2 }}>
              <Grid item xs={12} sm={6} md={2.4}>
                <FormControl fullWidth sx={{ bgcolor: 'background.paper', borderRadius: 3 }}>
                  <InputLabel>研究基地</InputLabel>
                  <Select
                    value={selectedResearchBase}
                    label="研究基地"
                    onChange={(e) => setSelectedResearchBase(e.target.value)}
                  >
                    <MenuItem value="全部">全部</MenuItem>
                    {houseOptions.map((house) => (
                      <MenuItem key={house.id} value={house.id}>
                        {house.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={2.4}>
                <FormControl fullWidth sx={{ bgcolor: 'background.paper', borderRadius: 3 }}>
                  <InputLabel>整建潛力</InputLabel>
                  <Select
                    value={selectedPotential}
                    label="整建潛力"
                    onChange={(e) => setSelectedPotential(e.target.value as '全部' | '高' | '中' | '低')}
                  >
                    <MenuItem value="全部">全部</MenuItem>
                    <MenuItem value="高">高</MenuItem>
                    <MenuItem value="中">中</MenuItem>
                    <MenuItem value="低">低</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={2.4}>
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

              <Grid item xs={12} sm={6} md={2.4}>
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

              <Grid item xs={12} sm={6} md={2.4}>
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
          <Box sx={{ flex: 1, minHeight: 0 }}>
            <MapBlock selectedResearchBase={selectedResearchBase} />
          </Box>
        </Card>
      )}
    </Box>
  );
};

export default HomePage;
