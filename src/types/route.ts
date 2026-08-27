export type ScheduleSlot = "Morning" | "Afternoon" | "Evening";

export interface RecurringRoute {
  id: string;
  vehicleId: string;
  category: string;
  slot: ScheduleSlot;
  date: string;
  startTime: string;
  endTime: string;
  campusDeparture?: string;
  pointDeparture?: string;
  routeSequence: string[];
}