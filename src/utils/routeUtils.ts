import type { VehicleOffDay, Weekday, StudentTransportVehicle } from "../types";

const WEEKDAY_INDEX: Weekday[] = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
];

export function getWeekdayFromDate(dateString: string): Weekday {
  const date = new Date(`${dateString}T00:00:00`);
  return WEEKDAY_INDEX[date.getDay()];
}

export function getOffDayForVehicleOnDate(
  vehicleId: string,
  dateString: string,
  offDays: VehicleOffDay[],
): VehicleOffDay | undefined {
  const weekday = getWeekdayFromDate(dateString);

  return offDays.find((offDay) => {
    if (offDay.vehicleId !== vehicleId) {
      return false;
    }

    if (offDay.type === "One-time") {
      return offDay.date === dateString;
    }

    return offDay.weekday === weekday;
  });
}

export function isVehicleOnOffDay(
  vehicleId: string,
  dateString: string,
  offDays: VehicleOffDay[],
): boolean {
  return Boolean(getOffDayForVehicleOnDate(vehicleId, dateString, offDays));
}

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function getStudentTransportEntry(
  vehicleId: string,
  routes: StudentTransportVehicle[],
): StudentTransportVehicle | undefined {
  return routes.find((entry) => entry.vehicleId === vehicleId);
}

export function isVehicleFreeAtTime(
  vehicleId: string,
  requestedTime: string,
  routes: StudentTransportVehicle[],
): boolean {
  const entry = getStudentTransportEntry(vehicleId, routes);

  if (!entry) {
    return true;
  }

  return toMinutes(requestedTime) >= toMinutes(entry.freeAfterTime);
}

export function formatTimeDisplay(time: string): string {
  const [hoursStr, minutes] = time.split(":");
  let hours = parseInt(hoursStr, 10);
  const period = hours >= 12 ? "PM" : "AM";

  hours = hours % 12;

  if (hours === 0) {
    hours = 12;
  }

  return `${hours}:${minutes} ${period}`;
}
