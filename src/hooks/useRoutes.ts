import useLocalStorageCollection from "./useLocalStorageCollection";
import type { StudentTransportVehicle } from "../types";

const STORAGE_KEY = "sust-transit-routes";

export default function useRoutes() {
  const { items, add, update, remove } =
    useLocalStorageCollection<StudentTransportVehicle>(STORAGE_KEY);

  return {
    routes: items,
    addRoute: add,
    updateRoute: update,
    deleteRoute: remove,
  };
}
