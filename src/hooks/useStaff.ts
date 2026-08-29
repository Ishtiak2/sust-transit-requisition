import { useEffect, useState } from "react";
import type { Staff } from "../types";

const STORAGE_KEY = "sust-transit-staff";

export default function useStaff() {
  const [staff, setStaff] = useState<Staff[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return [];
    }

    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(staff));
  }, [staff]);

  function addStaff(member: Staff) {
    setStaff((current) => [...current, member]);
  }

  function updateStaff(updated: Staff) {
    setStaff((current) =>
      current.map((member) => (member.id === updated.id ? updated : member)),
    );
  }

  function deactivateStaff(id: string) {
    setStaff((current) =>
      current.map((member) =>
        member.id === id
          ? {
              ...member,
              status: "Inactive",
              permanentVehicleId: undefined,
            }
          : member,
      ),
    );
  }

  return {
    staff,
    addStaff,
    updateStaff,
    deactivateStaff,
  };
}
