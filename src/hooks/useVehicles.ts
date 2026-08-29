import { useEffect, useState } from "react";
import type { Vehicle } from "../types";
import { isDuplicateRegistration } from "../utils/vehicleUtils";

const STORAGE_KEY = "sust-transit-vehicles";

export default function useVehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    const storedVehicles = localStorage.getItem(STORAGE_KEY);

    if (!storedVehicles) {
      return [];
    }

    try {
      return JSON.parse(storedVehicles);
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(vehicles));
  }, [vehicles]);

  function addVehicle(vehicle: Vehicle) {
    if (isDuplicateRegistration(vehicles, vehicle.registrationNumber)) {
      throw new Error(
        "A vehicle with this registration number already exists.",
      );
    }

    setVehicles((currentVehicles) => [...currentVehicles, vehicle]);
  }

  function updateVehicle(updatedVehicle: Vehicle) {
    if (
      isDuplicateRegistration(
        vehicles,
        updatedVehicle.registrationNumber,
        updatedVehicle.id,
      )
    ) {
      throw new Error(
        "A vehicle with this registration number already exists.",
      );
    }

    setVehicles((currentVehicles) =>
      currentVehicles.map((vehicle) =>
        vehicle.id === updatedVehicle.id ? updatedVehicle : vehicle,
      ),
    );
  }

  function deleteVehicle(vehicleId: string) {
    setVehicles((currentVehicles) =>
      currentVehicles.filter((vehicle) => vehicle.id !== vehicleId),
    );
  }

  return {
    vehicles,
    addVehicle,
    updateVehicle,
    deleteVehicle,
  };
}
