import { useMemo, useState } from "react";

import GovFormMasthead from "./application/GovFormMasthead";
import Step1Requester from "./application/Step1Requester";
import Step2TransportUser, {
  type TransportUserDraft,
} from "./application/Step2TransportUser";
import Step3Journey from "./application/Step3Journey";
import Step4Details, { type DetailsDraft } from "./application/Step4Details";
import { PART_LABEL, SECTION_TITLE, SECTION_WRAP } from "./application/formTheme";

import useAuth from "../hooks/useAuth";
import useNotifications from "../hooks/useNotifications";
import useRequisitions from "../hooks/useRequisitions";
import useUsers from "../hooks/useUsers";
import { requiresRecommendation } from "../utils/authUtils";
import {
  buildRequisitionNotifications,
  findDepartmentHeadsForRequisition,
} from "../utils/notificationUtils";
import { isWithinHoldWindow } from "../utils/validators";

import type { Requisition, RequisitionType, Trip, TripDraft } from "../types";
import { createEmptyTripDraft } from "../types";

interface RequisitionFormProps {
  onSubmit: (requisition: Requisition) => void;
  onCancel: () => void;
}

/**
 * Single-page applicant requisition form.
 *
 * All sections (requester, transport user, journey, details) are shown
 * together on one page — like the paper form it replaces — rather than
 * gated behind a multi-step wizard. Validation runs across every section
 * at once when the applicant submits or saves a draft, and any errors are
 * shown inline next to the relevant field plus summarised at the top.
 *
 * The legacy "paper form vs flexible multi-trip" branching from the
 * previous implementation is intentionally removed; that path was the
 * admin-only prototype and does not model this user journey.
 */
export default function RequisitionForm({
  onSubmit,
  onCancel,
}: RequisitionFormProps) {
  const { currentUser } = useAuth();
  const { addRequisition } = useRequisitions();
  const { addNotification } = useNotifications();
  const { users } = useUsers();

  const [sameAsRequester, setSameAsRequester] = useState(true);
  const [transportUser, setTransportUser] = useState<TransportUserDraft>({
    fullName: "",
    designation: "",
    mobile: "",
  });

  const [requisitionType, setRequisitionType] = useState<RequisitionType>(
    () =>
      currentUser?.applicantProfile === "Student"
        ? "Departmental/Official"
        : "Personal",
  );
  const [trips, setTrips] = useState<TripDraft[]>([createEmptyTripDraft()]);

  /**
   * Step 5 — "Personal" requisitions are always exactly one trip. When the
   * applicant switches into Personal from Departmental/Official (which
   * may have accumulated several trips), collapse back down to the first
   * one rather than silently dropping the type check that used to
   * enforce this. Switching the other way keeps whatever trips already
   * exist — Departmental/Official starts from at least one and the
   * applicant can add more.
   */
  function handleRequisitionTypeChange(next: RequisitionType) {
    setRequisitionType(next);
    if (next === "Personal") {
      setTrips((prev) => [prev[0] ?? createEmptyTripDraft()]);
    }
  }

  const [details, setDetails] = useState<DetailsDraft>({
    reason: "",
    supportingDocumentName: "",
    supportingDocumentDataUrl: undefined,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const requester = currentUser;
  const requiresRecommender = useMemo(
    () => requiresRecommendation(requester?.applicantProfile, requisitionType),
    [requester?.applicantProfile, requisitionType],
  );

  if (!requester) {
    return (
      <div className="border border-[#FEE2E2] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]">
        You must be signed in to apply for a vehicle. Please register or log in
        first.
      </div>
    );
  }

  const isPersonal = requisitionType === "Personal";

  function validateAll(): Record<string, string> {
    const next: Record<string, string> = {};

    if (!sameAsRequester) {
      if (!transportUser.fullName.trim()) {
        next.fullName = "Transport user name is required.";
      }
      if (!transportUser.mobile.trim()) {
        next.mobile = "Transport user mobile is required.";
      }
    }

    for (const trip of trips) {
      if (!trip.date) {
        next[`date-${trip.id}`] = "Date is required.";
      }
      if (!trip.startTime || !trip.endTime) {
        next[`time-${trip.id}`] = "Both From and To times are required.";
      }

      if (isPersonal) {
        if (!trip.destination.trim()) {
          next[`destination-${trip.id}`] = "Destination is required.";
        }
      } else if (!trip.stoppages.some((stop) => stop.trim())) {
        next[`stoppages-${trip.id}`] =
          "At least one stoppage is required.";
      }

      // Step 7 — 3-hour vehicle-hold limit is a hard block, not a
      // dismissible warning (folded into this step's validation per the
      // fix plan's Step 5.6).
      if (
        trip.startTime &&
        trip.endTime &&
        !isWithinHoldWindow(trip.startTime, trip.endTime)
      ) {
        next[`holdLimit-${trip.id}`] =
          "This trip exceeds the 3-hour vehicle-hold limit.";
      }
    }

    if (!details.reason.trim()) {
      next.reason = "Reason for requisition is required.";
    }

    return next;
  }

  function buildTrip(draft: TripDraft): Trip {
    const destination = draft.destination.trim();
    const stoppageSequence = isPersonal
      ? ["Campus", destination, "Campus"]
      : draft.stoppages.map((stop) => stop.trim()).filter(Boolean);
    const route = isPersonal
      ? `Campus to ${destination} and Return to Campus`
      : stoppageSequence.join(" → ");

    return {
      id: draft.id,
      date: draft.date,
      startTime: draft.startTime,
      endTime: draft.endTime,
      vehicleCategory: draft.vehicleCategory,
      route,
      stoppageSequence,
      passengerGroups: isPersonal
        ? []
        : draft.passengerGroups.map((group) => group.trim()).filter(Boolean),
      status: "Pending",
    };
  }

  function buildRequisition(status: Requisition["status"]): Requisition {
    const builtTrips = status === "Draft" ? [] : trips.map(buildTrip);
    const departmentOrOffice = requester!.department ?? requester!.office ?? "";
    const contactNumber = requester!.mobile ?? transportUser.mobile;
    const firstTripDate = trips[0]?.date ?? "";
    const hasSupportingDocument = Boolean(details.supportingDocumentDataUrl);

    return {
      id: crypto.randomUUID(),
      requesterId: requester!.id,
      requesterName:
        requester!.fullName?.trim() || transportUser.fullName.trim() || requester!.email,
      // Phase 6 — needed for mileage eligibility (FRD §23 scopes it to
      // Teacher/Officer personal-use, not every "Personal" requisition).
      applicantProfile: requester!.applicantProfile,
      department: departmentOrOffice.trim() || undefined,
      contactNumber: contactNumber?.trim() || undefined,
      requisitionType,
      purpose: details.reason.trim(),
      startDate: firstTripDate,
      endDate: firstTripDate,
      scheduleType: "Single",
      status,
      createdAt: new Date().toISOString(),
      trips: builtTrips,
      ...(hasSupportingDocument
        ? {
            supportingDocumentName: details.supportingDocumentName,
            supportingDocumentDataUrl: details.supportingDocumentDataUrl,
          }
        : {}),
    };
  }

  function handleSaveDraft() {
    setIsSubmitting(true);
    try {
      const draft = buildRequisition("Draft");
      addRequisition(draft);
      onSubmit(draft);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleSubmit() {
    const next = validateAll();
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setIsSubmitting(true);
    try {
      const finalStatus = requiresRecommender
        ? "Pending Recommendation"
        : "Pending on Transport Office";

      const requisition = buildRequisition(finalStatus);
      addRequisition(requisition);
      onSubmit(requisition);

      // When the recommender workflow applies, notify every DepartmentHead
      // whose head-of-department / head-of-office matches this
      // requisition's department. The Admin notification is dispatched in
      // ApplyRequisitionPage after the requisition is added; here we only
      // handle the recommender audience, and each is stamped with that
      // user's id so useNotifications can filter per-recipient.
      if (requiresRecommender) {
        const heads = findDepartmentHeadsForRequisition(requisition, users);
        for (const notification of buildRequisitionNotifications(heads, {
          requisition,
          type: "New Requisition",
          message: `${requisition.requesterName} submitted an official requisition (${requisition.requisitionType.toLowerCase()}) awaiting your recommendation.`,
        })) {
          addNotification(notification);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const errorCount = Object.keys(errors).length;
  const submitLabel = requiresRecommender
    ? "Proceed to Recommendation"
    : "Submit Application";
  const today = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="bg-form-paper px-5 py-6 sm:px-10 sm:py-8">
      <GovFormMasthead
        formTitle="Vehicle Requisition Form"
        referenceLabel="Ref. No.: assigned on submission"
      />

      <div className="mt-7 space-y-7">
        {errorCount > 0 ? (
          <div className="border border-form-seal/40 bg-form-seal/5 px-4 py-3 text-sm text-form-seal">
            Please fix {errorCount} field{errorCount === 1 ? "" : "s"} below
            before submitting.
          </div>
        ) : null}

        <FormSection first part="Part One" title="Requester Details">
          <Step1Requester requester={requester} />
        </FormSection>

        <FormSection part="Part Two" title="Transport User">
          <Step2TransportUser
            requester={requester}
            value={transportUser}
            sameAsRequester={sameAsRequester}
            onSameAsRequesterChange={setSameAsRequester}
            onChange={setTransportUser}
            errors={{
              fullName: errors.fullName,
              mobile: errors.mobile,
              designation: errors.designation,
            }}
          />
        </FormSection>

        <FormSection part="Part Three" title="Journey">
          <Step3Journey
            requisitionType={requisitionType}
            onRequisitionTypeChange={handleRequisitionTypeChange}
            trips={trips}
            onTripsChange={setTrips}
            applicantProfile={requester.applicantProfile}
            errors={errors}
          />
        </FormSection>

        <FormSection part="Part Four" title="Requisition Details">
          <Step4Details
            value={details}
            onChange={setDetails}
            errors={{ reason: errors.reason }}
          />
        </FormSection>

        {requiresRecommender ? (
          <p className="border border-[#B45309]/30 bg-[#FEF3C7]/60 px-4 py-3 text-sm text-[#B45309]">
            This requisition type requires your Department/Office Head to
            recommend it before Admin can review it.
          </p>
        ) : null}

        <div className={SECTION_WRAP}>
          <p className="text-sm leading-relaxed text-form-ink">
            I hereby declare that the information given above is true to the
            best of my knowledge, and I accept responsibility for the vehicle
            requested.
          </p>

          <div className="mt-5 flex flex-wrap items-end justify-between gap-8">
            <div>
              <p className="text-[13px] font-medium text-form-muted">
                Applicant's signature
              </p>
              {requester.signatureDataUrl ? (
                <img
                  src={requester.signatureDataUrl}
                  alt="Applicant signature"
                  className="mt-1 h-16 w-44 border-b border-form-rule object-contain object-left-bottom"
                />
              ) : (
                <p className="mt-1 h-16 w-44 border-b border-form-rule text-xs text-form-muted">
                  No signature on file
                </p>
              )}
            </div>

            <div className="text-right">
              <p className="text-[13px] font-medium text-form-muted">Date</p>
              <p className="mt-1 min-w-[10rem] border-b border-form-rule pb-1 text-sm text-form-ink">
                {today}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-form-rule pt-5">
          <button
            type="button"
            onClick={onCancel}
            className="h-10 rounded-none border border-form-rule bg-white px-4 text-sm font-medium text-form-muted hover:bg-form-band"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isSubmitting}
              className="h-10 rounded-none border border-form-rule bg-white px-4 text-sm font-medium text-form-muted hover:bg-form-band disabled:cursor-not-allowed"
            >
              Save as Draft
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="h-10 rounded-none bg-primary px-5 text-sm font-medium text-white hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** One numbered part of the form ("Part One — Requester Details"), echoing how the printed form divides its sections. */
function FormSection({
  first = false,
  part,
  title,
  children,
}: {
  first?: boolean;
  part: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className={first ? "" : SECTION_WRAP}>
      <p className={PART_LABEL}>{part}</p>
      <h2 className={`${SECTION_TITLE} mb-3`}>{title}</h2>
      {children}
    </div>
  );
}
