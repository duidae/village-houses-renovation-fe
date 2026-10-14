
import React, { useState, useCallback, useEffect } from 'react';
import HomePage from './components/HomePage';
import CaseAnalysisPage from './components/CaseAnalysisPage';
import CasePage from './components/CasePage';
import { mockAnalysisData } from './mocks/analysisData';
import { fetchProperties } from './services/propertiesService';
import type { HouseFilters } from './types';
import type { PropertyMarker } from './mocks/properties';
import { DEFAULT_FILTERS, matchesFilters } from './services/houseFilters';
import { Routes, Route, Navigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';

type HouseOption = { id: string; name: string };

const normalizeSearchText = (value: string): string =>
  value.normalize('NFKC').toLocaleLowerCase().replace(/[\s\p{P}\p{S}]/gu, '');

const getEditDistance = (left: string, right: string): number => {
  const previousRow = Array.from({ length: right.length + 1 }, (_, index) => index);

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    let diagonal = previousRow[0];
    previousRow[0] = leftIndex;

    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const above = previousRow[rightIndex];
      previousRow[rightIndex] = left[leftIndex - 1] === right[rightIndex - 1]
        ? diagonal
        : Math.min(diagonal, previousRow[rightIndex - 1], above) + 1;
      diagonal = above;
    }
  }

  return previousRow[right.length];
};

const getNameEditDistance = (query: string, name: string): number => {
  let closestDistance = Number.POSITIVE_INFINITY;
  const shortestWindow = Math.max(1, query.length - 1);
  const longestWindow = Math.min(name.length, query.length + 1);

  for (let windowLength = shortestWindow; windowLength <= longestWindow; windowLength += 1) {
    for (let start = 0; start <= name.length - windowLength; start += 1) {
      closestDistance = Math.min(
        closestDistance,
        getEditDistance(query, name.slice(start, start + windowLength)),
      );
    }
  }

  return closestDistance;
};

const findHouseMatch = <T extends HouseOption>(houseOptions: T[], searchText: string): T | undefined => {
  const query = normalizeSearchText(searchText);
  if (!query) return undefined;

  const rankedMatches = houseOptions
    .map((house, index) => {
      const name = normalizeSearchText(house.name);
      const distance = name.includes(query) ? 0 : getNameEditDistance(query, name);
      return { house, index, distance };
    })
    .filter(({ distance }) => distance <= (query.length === 1 ? 0 : Math.max(1, Math.floor(query.length * 0.35))))
    .sort((left, right) => left.distance - right.distance || left.index - right.index);

  return rankedMatches[0]?.house;
};

const App: React.FC = () => {
  const [schoolName, setSchoolName] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [houseOptions, setHouseOptions] = useState<PropertyMarker[]>([]);
  const [filters, setFilters] = useState<HouseFilters>(DEFAULT_FILTERS);
  const [selectedLocation, setSelectedLocation] = useState<'主幹道上' | '周邊有公共設施'>('主幹道上');
  const [selectedBuilding, setSelectedBuilding] = useState<'一條龍' | '單伸手' | '三合院' | '水泥連棟式' | '具歷史價值'>('一條龍');

  useEffect(() => {
    fetchProperties()
      .then(setHouseOptions)
      .catch((err: Error) => setError(err.message));
  }, []);

  const handleSearch = useCallback(async (searchSchoolName?: string) => {
    const trimmedSchoolName = (searchSchoolName || schoolName).trim();
    if (!trimmedSchoolName) {
      setError('請輸入宅院名稱。');
      return;
    }

    setError(null);
    const matchedHouse = findHouseMatch(houseOptions, trimmedSchoolName);
    if (!matchedHouse) {
      setError('找不到符合的宅院名稱。');
      return;
    }

    setSchoolName(matchedHouse.name);
    // A searched house is always shown: if the current criteria would hide it,
    // reset them rather than selecting a house that isn't on the map.
    setFilters((current) =>
      matchesFilters(matchedHouse, current)
        ? { ...current, houseId: matchedHouse.id }
        : { ...DEFAULT_FILTERS, houseId: matchedHouse.id }
    );
  }, [houseOptions, schoolName]);

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSearch();
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
              schoolName={schoolName}
              setSchoolName={setSchoolName}
              handleSearch={handleSearch}
              handleKeyPress={handleKeyPress}
              filters={filters}
              setFilters={setFilters}
              selectedLocation={selectedLocation}
              setSelectedLocation={setSelectedLocation}
              selectedBuilding={selectedBuilding}
              setSelectedBuilding={setSelectedBuilding}
            />
          }
        />
        <Route path="/analysis/case" element={<CaseAnalysisPage analysisData={mockAnalysisData} />} />
        <Route path="/cases/:id" element={<CasePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Container>
  </Box>
);
};

export default App;

