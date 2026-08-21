import { sampleProperties, type PropertyMarker } from '../mocks/properties';

const MOCK_LATENCY_MS = 300;

export const fetchProperties = (): Promise<PropertyMarker[]> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(sampleProperties), MOCK_LATENCY_MS);
  });
};
