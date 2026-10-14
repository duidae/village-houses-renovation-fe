import React, { useEffect, useState } from 'react';
import { AnalysisDashboard } from './AnalysisDashboard';
import { LoadingSpinner } from './LoadingSpinner';
import MapBlock from './MapBlock';
import { mockAnalysisData } from '../mocks/analysisData';
import { buildAnalysisDataForRecord, fetchVillageHouses, researchAreaLabel, type VillageHouseRecord } from '../services/villageHousesService';
import { fetchProperties } from '../services/propertiesService';
import { CONDITION_OPTIONS, CONNECTIVITY_OPTIONS, POTENTIAL_LEVELS, REUSE_TYPES, type HouseFilters } from '../types';
import type { PropertyMarker } from '../mocks/properties';
import { DEFAULT_FILTERS, hasActiveCriteria, matchesFilters, updateFilters } from '../services/houseFilters';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
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
import ClearIcon from '@mui/icons-material/Clear';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

interface HomePageProps {
  isLoading: boolean;
  error: string | null;
  schoolName: string;
  setSchoolName: React.Dispatch<React.SetStateAction<string>>;
  handleSearch: (searchSchoolName?: string) => Promise<void>;
  handleKeyPress: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  filters: HouseFilters;
  setFilters: React.Dispatch<React.SetStateAction<HouseFilters>>;
  selectedLocation: '主幹道上' | '周邊有公共設施';
  setSelectedLocation: React.Dispatch<React.SetStateAction<'主幹道上' | '周邊有公共設施'>>;
  selectedBuilding: '一條龍' | '單伸手' | '三合院' | '水泥連棟式' | '具歷史價值';
  setSelectedBuilding: React.Dispatch<React.SetStateAction<'一條龍' | '單伸手' | '三合院' | '水泥連棟式' | '具歷史價值'>>;
}

const HomePage: React.FC<HomePageProps> = ({
  isLoading,
  error,
  schoolName,
  setSchoolName,
  handleSearch,
  handleKeyPress,
  filters,
  setFilters,
  selectedLocation,
  setSelectedLocation,
  selectedBuilding,
  setSelectedBuilding,
}) => {
  const [houseOptions, setHouseOptions] = useState<PropertyMarker[]>([]);
  const [villageHouses, setVillageHouses] = useState<VillageHouseRecord[]>([]);
  const [isAnalysisVisible, setIsAnalysisVisible] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const controlSize = isSmallScreen ? 'small' : 'medium';

  useEffect(() => {
    fetchProperties().then(setHouseOptions);
    fetchVillageHouses().then(setVillageHouses);
  }, []);

  const researchAreaOptions = Array.from(
    new Set(
      villageHouses
        .map((house) => researchAreaLabel(house))
        .filter((area) => area.trim().length > 0)
    )
  );
  const selectedHouse = villageHouses.find((house) => house.id === filters.houseId);
  const selectedAnalysis = selectedHouse
    ? buildAnalysisDataForRecord(mockAnalysisData, selectedHouse)
    : null;
  const filteredHouseOptions = houseOptions.filter((house) => matchesFilters(house, filters));
  const isHouseSelected = filters.houseId !== '全部';
  // The dropdown lists every house matching the criteria, but once a house is
  // picked the map shows only that one, so the count follows the map.
  const shownHouseCount = isHouseSelected ? 1 : filteredHouseOptions.length;
  const setFilter = (patch: Partial<HouseFilters>) =>
    setFilters((current) => updateFilters(current, patch, houseOptions));

  const normalizedSearch = schoolName.trim().replace(/\s+/g, '').toLocaleLowerCase();
  const hasExactMatch = filteredHouseOptions.some(
    ({ name }) => name.replace(/\s+/g, '').toLocaleLowerCase() === normalizedSearch
  );
  const matchedHouses = normalizedSearch
    ? filteredHouseOptions
        .filter(({ name }) => name.replace(/\s+/g, '').toLocaleLowerCase().includes(normalizedSearch))
        .slice(0, 8)
    : [];

  useEffect(() => {
    setIsAnalysisVisible(false);
    if (!selectedHouse) return;

    const analysisElement = document.getElementById('case-analysis');
    if (!analysisElement) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsAnalysisVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );
    observer.observe(analysisElement);

    return () => observer.disconnect();
  }, [selectedHouse]);

  const scrollToAnalysis = () => {
    document.getElementById('case-analysis')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        overflowY: !isHouseSelected ? 'hidden' : 'auto',
      }}
    >
      {isLoading && <LoadingSpinner />}

      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      <Card sx={{ position: 'relative', overflow: !isHouseSelected ? 'hidden' : 'visible', bgcolor: 'background.paper', boxShadow: 5, borderRadius: 4, p: 3, mb: 1, flex: !isHouseSelected ? 1 : '0 0 auto', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <CardContent sx={{ position: 'relative', py: 2, flexShrink: 0 }}>
            <Grid container spacing={4} alignItems="flex-start">
              <Grid item xs={12} md={6} sx={{ position: 'relative', zIndex: 2 }}>
                <Typography variant="overline" component="p" sx={{ fontSize: '20px', letterSpacing: 2, mb: 2, color: 'primary.main' }}>
                  農村空間活化與特色建築物整建平台
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                  <Box
                    component="img"
                    src="/logo.png"
                    alt="Logo"
                    sx={{ width: 56, height: 56, borderRadius: 2, objectFit: 'contain' }}
                  />
                  <Typography variant="h3" component="h1" sx={{ fontWeight: 800 }}>
                    農村好宅##
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
                          size={controlSize}
                          value={schoolName}
                          onChange={(e) => setSchoolName(e.target.value)}
                          onFocus={() => setIsSearchFocused(true)}
                          onBlur={() => setIsSearchFocused(false)}
                          onKeyDown={handleKeyPress}
                          placeholder="輸入縣市、村里或宅院名稱"
                          variant="outlined"
                          InputProps={{
                            endAdornment: schoolName && (
                              <InputAdornment position="end">
                                <IconButton
                                  size="small"
                                  aria-label="清除搜尋"
                                  onMouseDown={(event) => event.preventDefault()}
                                  onClick={() => {
                                    setSchoolName('');
                                    setFilter({ houseId: '全部' });
                                  }}
                                >
                                  <ClearIcon fontSize="small" />
                                </IconButton>
                              </InputAdornment>
                            ),
                          }}
                        />
                        {isSearchFocused && matchedHouses.length > 0 && !hasExactMatch && (
                          <Paper
                            elevation={4}
                            sx={{ position: 'absolute', zIndex: 1300, left: 0, right: 0, mt: 1, maxHeight: 280, overflowY: 'auto' }}
                          >
                            <List disablePadding>
                              {matchedHouses.map((house) => (
                                <ListItemButton
                                  key={house.id}
                                  onMouseDown={(event) => {
                                    event.preventDefault();
                                    setSchoolName(house.name);
                                    setFilter({ houseId: house.id });
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
                        size={controlSize}
                        onClick={() => handleSearch()}
                        disabled={isLoading}
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
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size={controlSize} sx={{ bgcolor: 'background.paper', borderRadius: 3 }}>
                  <InputLabel>研究基地</InputLabel>
                  <Select
                    value={filters.area}
                    label="研究基地"
                    onChange={(e) => setFilter({ area: e.target.value })}
                  >
                    <MenuItem value="全部">全部</MenuItem>
                    {researchAreaOptions.map((area) => (
                      <MenuItem key={area} value={area}>
                        {area}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size={controlSize} sx={{ bgcolor: 'background.paper', borderRadius: 3 }}>
                  <InputLabel>宅院標的</InputLabel>
                  <Select
                    value={filters.houseId}
                    label="宅院標的"
                    onChange={(e) => setFilter({ houseId: e.target.value })}
                  >
                    <MenuItem value="全部">全部</MenuItem>
                    {filteredHouseOptions.map((house) => (
                      <MenuItem key={house.id} value={house.id}>
                        {house.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size={controlSize} sx={{ bgcolor: 'background.paper', borderRadius: 3 }}>
                  <InputLabel>整建潛力</InputLabel>
                  <Select
                    value={filters.potential}
                    label="整建潛力"
                    onChange={(e) => setFilter({ potential: e.target.value as HouseFilters['potential'] })}
                  >
                    <MenuItem value="全部">全部</MenuItem>
                    {POTENTIAL_LEVELS.map((level) => (
                      <MenuItem key={level} value={level}>{level}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/*
              <Grid item xs={12} sm={6} md={2}>
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

              <Grid item xs={12} sm={6} md={2}>
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
              */}

              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size={controlSize} sx={{ bgcolor: 'background.paper', borderRadius: 3 }}>
                  <InputLabel>再利用類型方向</InputLabel>
                  <Select
                    value={filters.reuse}
                    label="再利用類型方向"
                    onChange={(e) => setFilter({ reuse: e.target.value as HouseFilters['reuse'] })}
                  >
                    <MenuItem value="全部">全部</MenuItem>
                    {REUSE_TYPES.map((type) => (
                      <MenuItem key={type} value={type}>{type}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size={controlSize} sx={{ bgcolor: 'background.paper', borderRadius: 3 }}>
                  <InputLabel>社區連結</InputLabel>
                  <Select
                    value={filters.connectivity}
                    label="社區連結"
                    onChange={(e) => setFilter({ connectivity: e.target.value as HouseFilters['connectivity'] })}
                  >
                    <MenuItem value="全部">全部</MenuItem>
                    {CONNECTIVITY_OPTIONS.map((option) => (
                      <MenuItem key={option} value={option}>{option}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size={controlSize} sx={{ bgcolor: 'background.paper', borderRadius: 3 }}>
                  <InputLabel>建築物狀況</InputLabel>
                  <Select
                    value={filters.condition}
                    label="建築物狀況"
                    onChange={(e) => setFilter({ condition: e.target.value as HouseFilters['condition'] })}
                  >
                    <MenuItem value="全部">全部</MenuItem>
                    {CONDITION_OPTIONS.map((option) => (
                      <MenuItem key={option} value={option}>{option}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 2 }}>
              <Typography variant="body2" color={shownHouseCount === 0 ? 'error' : 'text.secondary'}>
                {shownHouseCount === 0
                  ? '沒有符合條件的宅院，請調整篩選條件'
                  : `符合條件：${shownHouseCount} / ${houseOptions.length} 筆宅院`}
              </Typography>
              {(hasActiveCriteria(filters) || isHouseSelected) && (
                <Button
                  size="small"
                  onClick={() => {
                    setSchoolName('');
                    setFilters(DEFAULT_FILTERS);
                  }}
                >
                  清除篩選
                </Button>
              )}
            </Stack>
          </CardContent>
          <Box
            sx={{
              flex: !isHouseSelected
                ? 1
                : { xs: '0 0 auto', md: '0 0 max(24rem, min(70vh, calc(100dvh - 22.5rem)))' },
              minHeight: 0,
            }}
          >
            <MapBlock
              filters={filters}
              onSelectHouse={(houseId) => setFilter({ houseId })}
              onViewAnalysis={scrollToAnalysis}
              showAnalysisButton={!isAnalysisVisible}
            />
          </Box>
          {selectedAnalysis && (
            <Box
              id="case-analysis"
              sx={{ bgcolor: 'grey.50', borderRadius: 3, boxShadow: 2, mt: 3, p: { xs: 2, md: 3 }, minHeight: '100vh', scrollMarginTop: 16 }}
            >
              <AnalysisDashboard id="case-analysis-report" data={selectedAnalysis} />
            </Box>
          )}
      </Card>
    </Box>
  );
};

export default HomePage;
