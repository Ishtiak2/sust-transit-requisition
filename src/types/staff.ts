export type DriverDesignation =
  | "Supervisor Driver"
  | "Senior Driver"
  | "Driver"
  | "Driver (Outsourced)";

export type StaffStatus = "Active" | "Inactive";

export interface Staff {
  id: string;
  name: string;
  designation: DriverDesignation;
  phone?: string;
  status: StaffStatus;

  // Vehicle permanently assigned to this driver
  permanentVehicleId?: string;
}
