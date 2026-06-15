export type VehicleType = "Bike" | "Car" | "Others";

export interface Vehicle {
  id: string;
  customer_id: string;
  type: VehicleType;
  manufacturer: string;
  model: string;
  registration_number: string;
  next_service_date: string | null;
}
