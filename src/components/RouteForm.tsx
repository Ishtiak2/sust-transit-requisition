import { useState } from "react";

import useVehicles from "../hooks/useVehicles";
import useRoutes from "../hooks/useRoutes";

import type { StudentTransportVehicle } from "../types";

interface RouteFormProps {
  route?: StudentTransportVehicle;
  onSubmit: (entry: StudentTransportVehicle) => void;
  onCancel: () => void;
}

interface FormErrors {
  vehicleId?: string;
  freeAfterTime?: string;
}

export default function RouteForm({ route, onSubmit, onCancel }: RouteFormProps) {
  const isEditing = Boolean(route);

  const { vehicles } = useVehicles();
  const { routes } = useRoutes();

  const [vehicleId, setVehicleId] = useState(route?.vehicleId ?? "");
  const [freeAfterTime, setFreeAfterTime] = useState(route?.freeAfterTime ?? "");

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState("");

  function validate(): boolean {
    const newErrors: FormErrors = {};

    if (!vehicleId) {
      newErrors.vehicleId = "Vehicle is required.";
    }

    if (!freeAfterTime) {
      newErrors.freeAfterTime = "Free After time is required.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitError("");

    if (!validate()) {
      return;
    }

    const duplicate = routes.find(
      (entry) => entry.vehicleId === vehicleId && entry.id !== route?.id,
    );

    if (duplicate) {
      setSubmitError(
        "This vehicle already has a Free After time set. Edit that entry instead.",
      );
      return;
    }

    const entry: StudentTransportVehicle = {
      id: route?.id ?? crypto.randomUUID(),
      vehicleId,
      freeAfterTime,
    };

    onSubmit(entry);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label
          htmlFor="vehicleId"
          className="mb-1.5 block text-sm font-medium text-[#1E293B]"
        >
          Vehicle
        </label>

        <select
          id="vehicleId"
          value={vehicleId}
          onChange={(event) => setVehicleId(event.target.value)}
          className="h-10 w-full rounded-md border border-[#E2E8F0] bg-white px-3 text-sm text-[#1E293B] outline-none focus:border-[#334E68] focus:ring-1 focus:ring-[#334E68]"
        >
          <option value="">Select a vehicle</option>

          {vehicles.map((vehicle) => (
            <option key={vehicle.id} value={vehicle.id}>
              {vehicle.registrationNumber} — {vehicle.category}
            </option>
          ))}
        </select>

        {errors.vehicleId && (
          <p className="mt-1 text-xs text-[#B91C1C]">{errors.vehicleId}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="freeAfterTime"
          className="mb-1.5 block text-sm font-medium text-[#1E293B]"
        >
          Free After
        </label>

        <input
          id="freeAfterTime"
          type="time"
          value={freeAfterTime}
          onChange={(event) => setFreeAfterTime(event.target.value)}
          className="h-10 w-full rounded-md border border-[#E2E8F0] px-3 text-sm text-[#1E293B] outline-none focus:border-[#334E68] focus:ring-1 focus:ring-[#334E68]"
        />

        <p className="mt-1 text-xs text-[#64748B]">
          Vehicle is unavailable for requisition before this time.
        </p>

        {errors.freeAfterTime && (
          <p className="mt-1 text-xs text-[#B91C1C]">{errors.freeAfterTime}</p>
        )}
      </div>

      {submitError && (
        <div className="rounded-md border border-[#FECACA] bg-[#FEF2F2] px-3 py-2">
          <p className="text-sm text-[#B91C1C]">{submitError}</p>
        </div>
      )}

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
          {isEditing ? "Save Changes" : "Add Vehicle"}
        </button>
      </div>
    </form>
  );
}
