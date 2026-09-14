
import React, { useState, useCallback, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { AnalysisData } from './types';
import HomePage from './components/HomePage';
import CaseAnalysisPage from './components/CaseAnalysisPage';
import CasePage from './components/CasePage';
import { mockAnalysisData } from './mocks/analysisData';
import { fetchProperties } from './services/propertiesService';
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

const findHouseMatch = (houseOptions: HouseOption[], searchText: string): HouseOption | undefined => {
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
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [houseOptions, setHouseOptions] = useState<HouseOption[]>([]);
  const [selectedResearchBase, setSelectedResearchBase] = useState<string>('全部');
  const [selectedPotential, setSelectedPotential] = useState<'高' | '中' | '低'>('中');
  const [selectedLocation, setSelectedLocation] = useState<'主幹道上' | '周邊有公共設施'>('主幹道上');
  const [selectedBuilding, setSelectedBuilding] = useState<'一條龍' | '單伸手' | '三合院' | '水泥連棟式' | '具歷史價值'>('一條龍');
  const [selectedReuse, setSelectedReuse] = useState<'綠色照顧據點' | '戶外開放空間' | '地方文化展示館' | '農村體驗空間' | '青年創業基地'>('綠色照顧據點');

  useEffect(() => {
    fetchProperties()
      .then((properties) => setHouseOptions(properties.map(({ id, name }) => ({ id, name }))))
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
    setSelectedResearchBase(matchedHouse.id);
  }, [houseOptions, schoolName]);

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
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
        <Route path="/cases/:id" element={<CasePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Container>
  </Box>
);
};

export default App;

