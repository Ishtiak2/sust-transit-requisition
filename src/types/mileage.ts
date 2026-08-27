export type MileageStatus = "Awaiting Mileage" | "Ready for Accounts";

export interface MileageEntry {
  id: string;
  requisitionId: string;
  distanceKm: number;
  recordedAt: string;
  status: MileageStatus;
}
