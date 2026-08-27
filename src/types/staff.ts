export type StaffDesignation =
  | "Supervisor Driver"
  | "Senior Driver"
  | "Driver"
  | "Driver (Grade-1)"
  | "Driver (Outsourced)"
  | "Assistant Supervisor"
  | "Assistant Auto Mechanic"
  | "Bus Conductor"
  | "Helper"
  | "Helper (Outsourced)";

export type EmploymentType = "Permanent" | "Outsourced";

export interface Staff {
  id: string;
  name: string;
  designation: StaffDesignation;
  employmentType: EmploymentType;
  contactNumber?: string;
  assignedVehicleId?: string;
}
