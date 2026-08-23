import React from 'react';
import { useParams } from 'react-router-dom';
import { sampleProperties } from '../mocks/properties';
import { mockAnalysisData } from '../mocks/analysisData';
import CaseAnalysisPage from './CaseAnalysisPage';

const CasePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const property = sampleProperties.find((p) => p.id === id);

  const analysisData = property
    ? {
        ...mockAnalysisData,
        basicInfo: {
          ...mockAnalysisData.basicInfo,
          name: property.name,
          latitude: property.lat,
          longitude: property.lng,
        },
        potentialIndex: {
          ...mockAnalysisData.potentialIndex,
          cpiScore: property.score,
        },
      }
    : mockAnalysisData;

  return <CaseAnalysisPage analysisData={analysisData} />;
};

export default CasePage;
