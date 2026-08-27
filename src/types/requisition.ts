import type { Trip } from "./trip";
export type RequisitionType = "Club" | "Official" | "Personal" | "Departmental";

export type ApplicationStatus =
  | "Pending Recommendation"
  | "Information Requested"
  | "Recommended"
  | "Partially Approved"
  | "Approved"
  | "Rejected";

export type TripStatus = "Pending" | "Approved" | "Rejected";

export type ScheduleType = "Single" | "Recurring";

export type RejectionReason =
  | "Vehicle unavailable"
  | "Driver unavailable"
  | "Schedule conflict"
  | "Other";

export interface Requisition {
  id: string;
  requesterId: string;
  requesterName: string;
  requisitionType: RequisitionType;
  purpose: string;
  startDate: string;
  endDate: string;
  scheduleType: ScheduleType;
  status: ApplicationStatus;
  trips: Trip[];
}
