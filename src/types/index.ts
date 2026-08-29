export { VEHICLE_CATEGORIES, VEHICLE_STATUSES } from "./vehicle";

export type { Vehicle, VehicleCategory, VehicleStatus } from "./vehicle";

export type { DriverDesignation, Staff, StaffStatus } from "./staff";

export const DRIVER_DESIGNATIONS = [
  "Supervisor Driver",
  "Senior Driver",
  "Driver",
  "Driver (Outsourced)",
] as const;

export const STAFF_STATUSES = ["Active", "Inactive"] as const;
