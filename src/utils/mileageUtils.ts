import type { Requisition, Trip, Allocation, MileageEntry } from "../types";

export interface MileageTripContext {
  requisition: Requisition;
  trip: Trip;
  allocation: Allocation;
}

export function isPersonalUseRequisition(requisition: Requisition): boolean {
  return requisition.requisitionType === "Personal";
}

export function getTripsAwaitingMileage(
  requisitions: Requisition[],
  allocations: Allocation[],
  mileageEntries: MileageEntry[],
): MileageTripContext[] {
  const recordedTripIds = new Set(mileageEntries.map((entry) => entry.tripId));
  const result: MileageTripContext[] = [];

  requisitions.filter(isPersonalUseRequisition).forEach((requisition) => {
    requisition.trips.forEach((trip) => {
      if (trip.status !== "Approved" || recordedTripIds.has(trip.id)) {
        return;
      }

      const allocation = allocations.find((item) => item.tripId === trip.id);

      if (allocation) {
        result.push({ requisition, trip, allocation });
      }
    });
  });

  return result.sort((a, b) => a.trip.date.localeCompare(b.trip.date));
}

export function getRecordedMileageTrips(
  requisitions: Requisition[],
  allocations: Allocation[],
  mileageEntries: MileageEntry[],
): (MileageTripContext & { entry: MileageEntry })[] {
  const result: (MileageTripContext & { entry: MileageEntry })[] = [];

  mileageEntries.forEach((entry) => {
    const requisition = requisitions.find(
      (item) => item.id === entry.requisitionId,
    );
    const trip = requisition?.trips.find((item) => item.id === entry.tripId);
    const allocation = allocations.find((item) => item.tripId === entry.tripId);

    if (requisition && trip && allocation) {
      result.push({ requisition, trip, allocation, entry });
    }
  });

  return result.sort((a, b) =>
    b.entry.recordedAt.localeCompare(a.entry.recordedAt),
  );
}

export type MileageColumnStatus =
  | { kind: "not-applicable" }
  | { kind: "not-ready" }
  | { kind: "awaiting"; context: MileageTripContext }
  | { kind: "recorded"; distanceKm: number };

export function getMileageColumnStatus(
  requisition: Requisition,
  allocations: Allocation[],
  mileageEntries: MileageEntry[],
): MileageColumnStatus {
  if (!isPersonalUseRequisition(requisition)) {
    return { kind: "not-applicable" };
  }

  const recordedEntry = mileageEntries.find(
    (entry) => entry.requisitionId === requisition.id,
  );

  if (recordedEntry) {
    return { kind: "recorded", distanceKm: recordedEntry.distanceKm };
  }

  const approvedTrip = requisition.trips.find(
    (trip) => trip.status === "Approved",
  );

  if (!approvedTrip) {
    return { kind: "not-ready" };
  }

  const allocation = allocations.find(
    (item) => item.tripId === approvedTrip.id,
  );

  if (!allocation) {
    return { kind: "not-ready" };
  }

  return {
    kind: "awaiting",
    context: { requisition, trip: approvedTrip, allocation },
  };
}
