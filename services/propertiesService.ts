import type { PropertyMarker } from '../mocks/properties';
import { fetchVillageHouses, toPropertyMarkers } from './villageHousesService';

export const fetchProperties = (): Promise<PropertyMarker[]> => {
  return fetchVillageHouses().then(toPropertyMarkers);
};
