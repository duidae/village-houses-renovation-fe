import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { mockAnalysisData } from '../mocks/analysisData';
import { fetchVillageHouses, buildAnalysisDataForRecord, type VillageHouseRecord } from '../services/villageHousesService';
import CaseAnalysisPage from './CaseAnalysisPage';
import { LoadingSpinner } from './LoadingSpinner';

const CasePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [records, setRecords] = useState<VillageHouseRecord[] | null>(null);

  useEffect(() => {
    fetchVillageHouses().then(setRecords);
  }, []);

  if (!records) {
    return <LoadingSpinner />;
  }

  const record = records.find((r) => r.id === id);
  const analysisData = record ? buildAnalysisDataForRecord(mockAnalysisData, record) : mockAnalysisData;

  return <CaseAnalysisPage analysisData={analysisData} />;
};

export default CasePage;
