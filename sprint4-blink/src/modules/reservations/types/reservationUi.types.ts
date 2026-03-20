export interface ReservationVehicleCardSpecs {
  seatsLabel?: string;
  doorsLabel?: string;
  luggageLabel?: string;
  transmissionLabel?: string;
  acLabel?: string;
  minAgeLabel?: string;
}

export interface ReservationVehicleCardPricing {
  fromLabel?: string;
  pricePerDay?: string;
  totalLabel?: string;
  total?: string;
}

export interface ReservationVehicleCardModel {
  id: string | number;
  name: string;
  category: string;
  licensePlate?: string;
  brand?: string;
  model?: string;
  available?: boolean;
  description?: string;
  specs?: ReservationVehicleCardSpecs;
  features?: string[];
  pricing?: ReservationVehicleCardPricing;
}