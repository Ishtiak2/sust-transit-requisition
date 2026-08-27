export type AllocationStatus = "Pending" | "Approved" | "Rejected";

export interface Allocation {
  id: string;
  requisitionId: string;
  tripId: string;
  vehicleId: string;
  driverId: string;
  status: AllocationStatus;
  allocatedAt?: string;
}
