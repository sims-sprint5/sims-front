export interface ReservationFilters {
  search: string;
  status: string | null;
  brand: string | null;
  yearFrom: number | null;
  yearTo: number | null;
}

export function createDefaultReservationFilters(): ReservationFilters {
  return {
    search: '',
    status: null,
    brand: null,
    yearFrom: null,
    yearTo: null,
  };
}