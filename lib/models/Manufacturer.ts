import type { VehicleType } from "./Vehicle";

export interface Manufacturer {
  id: string;
  name: string;
  vehicle_types: VehicleType[];
}
