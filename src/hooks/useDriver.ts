import useLocalStorageCollection from "./useLocalStorageCollection";
import type { Driver } from "../types";

const STORAGE_KEY = "sust-transit-driver";

export default function useDriver() {
  const { items, add, update, remove } =
    useLocalStorageCollection<Driver>(STORAGE_KEY);

  function deactivateDriver(id: string) {
    const member = items.find((item) => item.id === id);

    if (member) {
      update({ ...member, status: "Inactive", permanentVehicleId: undefined });
    }
  }

  return {
    driver: items,
    addDriver: add,
    updateDriver: update,
    deactivateDriver,
    deleteDriver: remove,
  };
}
