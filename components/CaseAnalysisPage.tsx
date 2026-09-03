import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import type { AnalysisData } from '../types';
import { AnalysisDashboard } from './AnalysisDashboard';
import Box from '@mui/material/Box';
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
    <Box sx={{ bgcolor: 'grey.50', minHeight: '100vh', py: 3, px: { xs: 2, md: 4 } }}>
      <Box sx={{ bgcolor: 'common.white', borderRadius: 3, boxShadow: 2, p: 3 }}>
        <Stack direction="row" justifyContent="flex-start" sx={{ mb: 2 }}>
          <Button variant="outlined" onClick={() => navigate('/')}>返回搜尋</Button>
        </Stack>
        <AnalysisDashboard id="analysis-report" data={analysisData} />
      </Box>
    </Box>
  );
};

export default CaseAnalysisPage;
