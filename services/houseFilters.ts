import type { PropertyMarker } from '../mocks/properties';
import type { HouseFilters, PotentialLevel } from '../types';
import { researchAreaLabel } from './villageHousesService';

export const DEFAULT_FILTERS: HouseFilters = {
  area: '全部',
  houseId: '全部',
  potential: '全部',
  reuse: '全部',
  connectivity: '全部',
  condition: '全部',
};

export const getPotentialLevel = (score: number): PotentialLevel => {
  if (score >= 80) return '高';
  if (score >= 60) return '中';
  return '低';
};

// Whether a house satisfies every attribute filter. The houseId filter is
// deliberately not checked here: it's a selection, not a criterion.
export function matchesFilters(house: PropertyMarker, filters: HouseFilters): boolean {
  return (
    (filters.area === '全部' || researchAreaLabel(house) === filters.area) &&
    (filters.potential === '全部' || getPotentialLevel(house.score) === filters.potential) &&
    (filters.reuse === '全部' || house.reuseTypes.includes(filters.reuse)) &&
    (filters.connectivity === '全部' || house.connectivity.includes(filters.connectivity)) &&
    (filters.condition === '全部' || house.condition.includes(filters.condition))
  );
}

export function hasActiveCriteria(filters: HouseFilters): boolean {
  return (Object.keys(DEFAULT_FILTERS) as (keyof HouseFilters)[]).some(
    (key) => key !== 'houseId' && filters[key] !== '全部'
  );
}

// Applies a filter change, dropping the selected house if it no longer matches.
export function updateFilters(
  filters: HouseFilters,
  patch: Partial<HouseFilters>,
  houses: PropertyMarker[]
): HouseFilters {
  const next = { ...filters, ...patch };
  if (next.houseId === '全部' || 'houseId' in patch) return next;
  const selected = houses.find((house) => house.id === next.houseId);
  return selected && matchesFilters(selected, next) ? next : { ...next, houseId: '全部' };
}
