export interface ReservationFilters {
  search: string;
  brand: string | null;
  yearFrom: number | null;
  yearTo: number | null;
}

export function createDefaultReservationFilters(): ReservationFilters {
  return {
    search: '',
    brand: null,
    yearFrom: null,
    yearTo: null,
  };
}