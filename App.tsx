
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

const App: React.FC = () => {
  const [schoolName, setSchoolName] = useState<string>('');
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [houseOptions, setHouseOptions] = useState<{ id: string; name: string }[]>([]);
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
    const normalizedSearch = trimmedSchoolName.replace(/\s+/g, '').toLocaleLowerCase();
    const matchedHouse = houseOptions.find(({ name }) =>
      name.replace(/\s+/g, '').toLocaleLowerCase().includes(normalizedSearch)
    );
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

  const exampleSchools = ['嘉義好宅1', '嘉義好宅2', '嘉義好宅3', '嘉義好宅4'];

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

