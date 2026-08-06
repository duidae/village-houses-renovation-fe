import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import type { AnalysisData } from '../types';
import { AnalysisDashboard } from './AnalysisDashboard';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';

interface CaseAnalysisPageProps {
  analysisData: AnalysisData | null;
}

const CaseAnalysisPage: React.FC<CaseAnalysisPageProps> = ({ analysisData }) => {
  const navigate = useNavigate();

  if (!analysisData) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
        <Button variant="outlined" onClick={() => navigate('/')}>返回搜尋</Button>
      </Stack>
      <AnalysisDashboard id="analysis-report" data={analysisData} />
    </>
  );
};

export default CaseAnalysisPage;
