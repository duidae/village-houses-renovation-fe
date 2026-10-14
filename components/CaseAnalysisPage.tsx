import React from 'react';
import { Navigate } from 'react-router-dom';
import type { AnalysisData } from '../types';
import { AnalysisDashboard } from './AnalysisDashboard';
import Box from '@mui/material/Box';

interface CaseAnalysisPageProps {
  analysisData: AnalysisData | null;
}

const CaseAnalysisPage: React.FC<CaseAnalysisPageProps> = ({ analysisData }) => {
  if (!analysisData) {
    return <Navigate to="/" replace />;
  }

  return (
    <Box sx={{ bgcolor: 'grey.50', minHeight: '100vh', py: 3, px: { xs: 2, md: 4 } }}>
      <Box sx={{ bgcolor: 'common.white', borderRadius: 3, boxShadow: 2, p: 3 }}>
        <AnalysisDashboard id="analysis-report" data={analysisData} />
      </Box>
    </Box>
  );
};

export default CaseAnalysisPage;
