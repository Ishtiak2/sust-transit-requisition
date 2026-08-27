export type VehicleCategory =
  | "Jeep"
  | "Car"
  | "Mitsubishi Bus"
  | "Hino Bus"
  | "Tata Bus"
  | "Minibus"
  | "Minibus A/C"
  | "Microbus"
  | "Pickup";

export type VehicleStatus = "Active" | "Under Maintenance" | "Out-of-Service";

export interface Vehicle {
  id: string;
  registrationNumber: string;
  category: VehicleCategory;
  fuelType?: string;
  operationalStatus: VehicleStatus;
  reservedFor?: string;
  availableForRequisition: boolean;
}
//The ? means optional.