import { useState } from "react";

import {
  REQUISITION_TYPES,
  APPLICANT_TYPES,
  VEHICLE_CATEGORIES,
  type Requisition,
  type RequisitionType,
  type ApplicantType,
  type ScheduleType,
  type VehicleCategory,
  type Trip,
} from "../types";

interface RequisitionFormProps {
  onSubmit: (requisition: Requisition) => void;
  onCancel: () => void;
}

interface TripDraft {
  key: string;
  date: string;
  startTime: string;
  endTime: string;
  vehicleCategory: VehicleCategory | "";
  route: string;
  stops: string[];
  passengerGroups: string;
}

interface FormErrors {
  requesterName?: string;
  purpose?: string;
  startDate?: string;
  endDate?: string;
  trips?: string;
}

function emptyTrip(): TripDraft {
  return {
    key: crypto.randomUUID(),
    date: "",
    startTime: "",
    endTime: "",
    vehicleCategory: "",
    route: "",
    stops: [""],
    passengerGroups: "",
  };
}

export default function RequisitionForm({
  onSubmit,
  onCancel,
}: RequisitionFormProps) {
  const [requesterName, setRequesterName] = useState("");
  const [applicantType, setApplicantType] =
    useState<ApplicantType>("Individual");
  const [department, setDepartment] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [requisitionType, setRequisitionType] = useState<RequisitionType>(
    REQUISITION_TYPES[0],
  );
  const [purpose, setPurpose] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [scheduleType, setScheduleType] = useState<ScheduleType>("Single");
  const [trips, setTrips] = useState<TripDraft[]>([emptyTrip()]);

  const [errors, setErrors] = useState<FormErrors>({});

  function updateTrip(key: string, patch: Partial<TripDraft>) {
    setTrips((current) =>
      current.map((trip) => (trip.key === key ? { ...trip, ...patch } : trip)),
    );
  }

  function addTrip() {
    setTrips((current) => [...current, emptyTrip()]);
  }

  function removeTrip(key: string) {
    setTrips((current) => current.filter((trip) => trip.key !== key));
  }

  function updateStop(tripKey: string, index: number, value: string) {
    setTrips((current) =>
      current.map((trip) =>
        trip.key === tripKey
          ? {
              ...trip,
              stops: trip.stops.map((stop, stopIndex) =>
                stopIndex === index ? value : stop,
              ),
            }
          : trip,
      ),
    );
  }

  function addStop(tripKey: string) {
    setTrips((current) =>
      current.map((trip) =>
        trip.key === tripKey ? { ...trip, stops: [...trip.stops, ""] } : trip,
      ),
    );
  }

  function removeStop(tripKey: string, index: number) {
    setTrips((current) =>
      current.map((trip) =>
        trip.key === tripKey
          ? {
              ...trip,
              stops: trip.stops.filter((_, stopIndex) => stopIndex !== index),
            }
          : trip,
      ),
    );
  }

  function validate(): boolean {
    const newErrors: FormErrors = {};

    if (!requesterName.trim()) {
      newErrors.requesterName = "Requester name is required.";
    }

    if (!purpose.trim()) {
      newErrors.purpose = "Purpose is required.";
    }

    if (!startDate) {
      newErrors.startDate = "Start date is required.";
    }

    if (!endDate) {
      newErrors.endDate = "End date is required.";
    } else if (startDate && endDate < startDate) {
      newErrors.endDate = "End date cannot be before start date.";
    }

    const validTrips = trips.filter(
      (trip) =>
        trip.date &&
        trip.startTime &&
        trip.endTime &&
        trip.vehicleCategory &&
        trip.route.trim(),
    );

    if (validTrips.length === 0) {
      newErrors.trips =
        "Add at least one complete trip (date, time, vehicle category, route).";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    const builtTrips: Trip[] = trips
      .filter(
        (trip) =>
          trip.date &&
          trip.startTime &&
          trip.endTime &&
          trip.vehicleCategory &&
          trip.route.trim(),
      )
      .map((trip) => ({
        id: crypto.randomUUID(),
        date: trip.date,
        startTime: trip.startTime,
        endTime: trip.endTime,
        vehicleCategory: trip.vehicleCategory as VehicleCategory,
        route: trip.route.trim(),
        stoppageSequence: trip.stops.map((stop) => stop.trim()).filter(Boolean),
        passengerGroups: trip.passengerGroups
          .split(",")
          .map((group) => group.trim())
          .filter(Boolean),
        status: "Pending",
      }));

    const requisition: Requisition = {
      id: crypto.randomUUID(),
      requesterId: crypto.randomUUID(),
      requesterName: requesterName.trim(),
      applicantType,
      department: department.trim() || undefined,
      contactNumber: contactNumber.trim() || undefined,
      requisitionType,
      purpose: purpose.trim(),
      startDate,
      endDate,
      scheduleType,
      status: "Recommended",
      createdAt: new Date().toISOString(),
      trips: builtTrips,
    };

    onSubmit(requisition);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <p className="rounded-md border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-2 text-xs text-[#334E68]">
        This creates a requisition already at "Recommended" status — simulating
        one that already passed the recommender workflow, which this system
        doesn't implement.
      </p>

      {/* Requester */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="requesterName"
            className="mb-1.5 block text-sm font-medium text-[#1E293B]"
          >
            Requester Name
          </label>

          <input
            id="requesterName"
            type="text"
            value={requesterName}
            onChange={(event) => setRequesterName(event.target.value)}
            className="h-10 w-full rounded-md border border-[#E2E8F0] px-3 text-sm text-[#1E293B] outline-none focus:border-[#334E68] focus:ring-1 focus:ring-[#334E68]"
          />

          {errors.requesterName && (
            <p className="mt-1 text-xs text-[#B91C1C]">
              {errors.requesterName}
            </p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#1E293B]">
            Applicant Type
          </label>

          <div className="flex h-10 items-center gap-5">
            {APPLICANT_TYPES.map((type) => (
              <label
                key={type}
                className="flex items-center gap-2 text-sm text-[#1E293B]"
              >
                <input
                  type="radio"
                  name="applicantType"
                  checked={applicantType === type}
                  onChange={() => setApplicantType(type)}
                />
                {type}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label
            htmlFor="department"
            className="mb-1.5 block text-sm font-medium text-[#1E293B]"
          >
            Department / Organization (optional)
          </label>

          <input
            id="department"
            type="text"
            value={department}
            onChange={(event) => setDepartment(event.target.value)}
            className="h-10 w-full rounded-md border border-[#E2E8F0] px-3 text-sm text-[#1E293B] outline-none focus:border-[#334E68] focus:ring-1 focus:ring-[#334E68]"
          />
        </div>

        <div>
          <label
            htmlFor="contactNumber"
            className="mb-1.5 block text-sm font-medium text-[#1E293B]"
          >
            Contact Number (optional)
          </label>

          <input
            id="contactNumber"
            type="text"
            value={contactNumber}
            onChange={(event) => setContactNumber(event.target.value)}
            className="h-10 w-full rounded-md border border-[#E2E8F0] px-3 text-sm text-[#1E293B] outline-none focus:border-[#334E68] focus:ring-1 focus:ring-[#334E68]"
          />
        </div>
      </div>

      {/* Type / Purpose */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="requisitionType"
            className="mb-1.5 block text-sm font-medium text-[#1E293B]"
          >
            Requisition Type
          </label>

          <select
            id="requisitionType"
            value={requisitionType}
            onChange={(event) =>
              setRequisitionType(event.target.value as RequisitionType)
            }
            className="h-10 w-full rounded-md border border-[#E2E8F0] bg-white px-3 text-sm text-[#1E293B] outline-none focus:border-[#334E68] focus:ring-1 focus:ring-[#334E68]"
          >
            {REQUISITION_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#1E293B]">
            Schedule Type
          </label>

          <div className="flex h-10 items-center gap-5">
            <label className="flex items-center gap-2 text-sm text-[#1E293B]">
              <input
                type="radio"
                name="scheduleType"
                checked={scheduleType === "Single"}
                onChange={() => setScheduleType("Single")}
              />
              Single
            </label>

            <label className="flex items-center gap-2 text-sm text-[#1E293B]">
              <input
                type="radio"
                name="scheduleType"
                checked={scheduleType === "Recurring"}
                onChange={() => setScheduleType("Recurring")}
              />
              Recurring
            </label>
          </div>
        </div>
      </div>

      <div>
        <label
          htmlFor="purpose"
          className="mb-1.5 block text-sm font-medium text-[#1E293B]"
        >
          Purpose
        </label>

        <textarea
          id="purpose"
          value={purpose}
          onChange={(event) => setPurpose(event.target.value)}
          rows={2}
          className="w-full rounded-md border border-[#E2E8F0] px-3 py-2 text-sm text-[#1E293B] outline-none focus:border-[#334E68] focus:ring-1 focus:ring-[#334E68]"
        />

        {errors.purpose && (
          <p className="mt-1 text-xs text-[#B91C1C]">{errors.purpose}</p>
        )}
      </div>

      {/* Dates */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="startDate"
            className="mb-1.5 block text-sm font-medium text-[#1E293B]"
          >
            Start Date
          </label>

          <input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            className="h-10 w-full rounded-md border border-[#E2E8F0] px-3 text-sm text-[#1E293B] outline-none focus:border-[#334E68] focus:ring-1 focus:ring-[#334E68]"
          />

          {errors.startDate && (
            <p className="mt-1 text-xs text-[#B91C1C]">{errors.startDate}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="endDate"
            className="mb-1.5 block text-sm font-medium text-[#1E293B]"
          >
            End Date
          </label>

          <input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            className="h-10 w-full rounded-md border border-[#E2E8F0] px-3 text-sm text-[#1E293B] outline-none focus:border-[#334E68] focus:ring-1 focus:ring-[#334E68]"
          />

          {errors.endDate && (
            <p className="mt-1 text-xs text-[#B91C1C]">{errors.endDate}</p>
          )}
        </div>
      </div>

      {/* Trips */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm font-medium text-[#1E293B]">
            Trip Requests
          </label>

          <button
            type="button"
            onClick={addTrip}
            className="text-sm font-medium text-[#334E68] hover:underline"
          >
            + Add Trip
          </button>
        </div>

        <div className="space-y-4">
          {trips.map((trip, tripIndex) => (
            <div
              key={trip.key}
              className="rounded-md border border-[#E2E8F0] p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium text-[#1E293B]">
                  Trip {tripIndex + 1}
                </p>

                {trips.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTrip(trip.key)}
                    className="text-xs font-medium text-[#B91C1C] hover:underline"
                  >
                    Remove Trip
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#64748B]">
                    Date
                  </label>

                  <input
                    type="date"
                    value={trip.date}
                    onChange={(event) =>
                      updateTrip(trip.key, { date: event.target.value })
                    }
                    className="h-9 w-full rounded-md border border-[#E2E8F0] px-3 text-sm text-[#1E293B] outline-none focus:border-[#334E68] focus:ring-1 focus:ring-[#334E68]"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-[#64748B]">
                    Vehicle Category
                  </label>

                  <select
                    value={trip.vehicleCategory}
                    onChange={(event) =>
                      updateTrip(trip.key, {
                        vehicleCategory: event.target.value as VehicleCategory,
                      })
                    }
                    className="h-9 w-full rounded-md border border-[#E2E8F0] bg-white px-3 text-sm text-[#1E293B] outline-none focus:border-[#334E68] focus:ring-1 focus:ring-[#334E68]"
                  >
                    <option value="">Select category</option>

                    {VEHICLE_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-[#64748B]">
                    Start Time
                  </label>

                  <input
                    type="time"
                    value={trip.startTime}
                    onChange={(event) =>
                      updateTrip(trip.key, { startTime: event.target.value })
                    }
                    className="h-9 w-full rounded-md border border-[#E2E8F0] px-3 text-sm text-[#1E293B] outline-none focus:border-[#334E68] focus:ring-1 focus:ring-[#334E68]"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-[#64748B]">
                    End Time
                  </label>

                  <input
                    type="time"
                    value={trip.endTime}
                    onChange={(event) =>
                      updateTrip(trip.key, { endTime: event.target.value })
                    }
                    className="h-9 w-full rounded-md border border-[#E2E8F0] px-3 text-sm text-[#1E293B] outline-none focus:border-[#334E68] focus:ring-1 focus:ring-[#334E68]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-[#64748B]">
                    Destination / Route
                  </label>

                  <input
                    type="text"
                    value={trip.route}
                    onChange={(event) =>
                      updateTrip(trip.key, { route: event.target.value })
                    }
                    placeholder="e.g. Campus to Osmani International Airport"
                    className="h-9 w-full rounded-md border border-[#E2E8F0] px-3 text-sm text-[#1E293B] outline-none placeholder:text-[#64748B] focus:border-[#334E68] focus:ring-1 focus:ring-[#334E68]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-[#64748B]">
                    Passenger Groups (comma-separated, optional)
                  </label>

                  <input
                    type="text"
                    value={trip.passengerGroups}
                    onChange={(event) =>
                      updateTrip(trip.key, {
                        passengerGroups: event.target.value,
                      })
                    }
                    placeholder="e.g. Contestants, Judges and Guests"
                    className="h-9 w-full rounded-md border border-[#E2E8F0] px-3 text-sm text-[#1E293B] outline-none placeholder:text-[#64748B] focus:border-[#334E68] focus:ring-1 focus:ring-[#334E68]"
                  />
                </div>
              </div>

              <div className="mt-3">
                <label className="mb-1 block text-xs font-medium text-[#64748B]">
                  Stoppage Sequence
                </label>

                <div className="space-y-2">
                  {trip.stops.map((stop, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={stop}
                        onChange={(event) =>
                          updateStop(trip.key, index, event.target.value)
                        }
                        placeholder={`Stop ${index + 1}`}
                        className="h-9 w-full rounded-md border border-[#E2E8F0] px-3 text-sm text-[#1E293B] outline-none placeholder:text-[#64748B] focus:border-[#334E68] focus:ring-1 focus:ring-[#334E68]"
                      />

                      {trip.stops.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeStop(trip.key, index)}
                          className="h-9 rounded-md border border-[#E2E8F0] px-3 text-xs font-medium text-[#B91C1C] hover:bg-[#F8FAFC]"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => addStop(trip.key)}
                  className="mt-2 text-xs font-medium text-[#334E68] hover:underline"
                >
                  + Add Stop
                </button>
              </div>
            </div>
          ))}
        </div>

        {errors.trips && (
          <p className="mt-2 text-xs text-[#B91C1C]">{errors.trips}</p>
        )}
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-3 border-t border-[#E2E8F0] pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="h-10 rounded-md border border-[#E2E8F0] bg-white px-4 text-sm font-medium text-[#334E68] hover:bg-[#F8FAFC]"
        >
          Cancel
        </button>

        <button
          type="submit"
          className="h-10 rounded-md bg-[#0F2747] px-4 text-sm font-medium text-white hover:bg-[#334E68]"
        >
          Add Requisition
        </button>
      </div>
    </form>
  );
}
