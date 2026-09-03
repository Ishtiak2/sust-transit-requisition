import { useMemo, useState } from "react";

import StepIndicator from "./application/StepIndicator";
import Step1Requester from "./application/Step1Requester";
import Step2TransportUser, {
  type TransportUserDraft,
} from "./application/Step2TransportUser";
import Step3Journey, { type JourneyDraft } from "./application/Step3Journey";
import Step4Details, { type DetailsDraft } from "./application/Step4Details";
import Step5Recommendation from "./application/Step5Recommendation";

import useAuth from "../hooks/useAuth";
import useNotifications from "../hooks/useNotifications";
import useRequisitions from "../hooks/useRequisitions";
import { requiresRecommendation } from "../utils/authUtils";

import type { Requisition, Trip } from "../types";

interface RequisitionFormProps {
  onSubmit: (requisition: Requisition) => void;
  onCancel: () => void;
}

/**
 * Phase 3 — 5-step applicant requisition form.
 *
 * Step 1 reads the verified profile (no input).
 * Step 2 collects who physically uses the transport.
 * Step 3 collects the journey (date, time, destination, purpose, type).
 * Step 4 collects the reason and an optional supporting document.
 * Step 5 is the review & submit screen.
 *
 * The Submit handler routes to "Pending Recommendation" when the
 * recommender workflow applies (Officer/Teacher/Student + Official) or
 * straight to "Pending Approval" otherwise. Save-as-Draft persists the
 * requisition with status "Draft" and an empty trips array — the trip
 * becomes valid once the user fills the Journey step and re-submits.
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

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  const [sameAsRequester, setSameAsRequester] = useState(true);
  const [transportUser, setTransportUser] = useState<TransportUserDraft>({
    fullName: "",
    designation: "",
    mobile: "",
  });

  const [journey, setJourney] = useState<JourneyDraft>({
    date: "",
    startTime: "",
    endTime: "",
    destination: "",
    purpose: "",
    requisitionType: "Personal",
  });

  const [details, setDetails] = useState<DetailsDraft>({
    reason: "",
    supportingDocumentName: "",
    supportingDocumentDataUrl: undefined,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const requester = currentUser;
  const requiresRecommender = useMemo(
    () =>
      requiresRecommendation(requester?.applicantProfile, journey.requisitionType),
    [requester?.applicantProfile, journey.requisitionType],
  );

  if (!requester) {
    return (
      <div className="rounded-md border border-[#FEE2E2] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]">
        You must be signed in to apply for a vehicle. Please register or log in
        first.
      </div>
    );
  }

  function clearErrors() {
    setErrors({});
  }

  function validateStep2(): boolean {
    const next: Record<string, string> = {};
    if (sameAsRequester) return true;
    if (!transportUser.fullName.trim()) {
      next.fullName = "Transport user name is required.";
    }
    if (!transportUser.mobile.trim()) {
      next.mobile = "Transport user mobile is required.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function validateStep3(): boolean {
    const next: Record<string, string> = {};
    if (!journey.date) {
      next.date = "Date is required.";
    }
    if (!journey.startTime || !journey.endTime) {
      next.time = "Both From and To times are required.";
    }
    if (!journey.destination.trim()) {
      next.destination = "Destination is required.";
    }
    if (!journey.purpose.trim()) {
      next.purpose = "Purpose is required.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function validateStep4(): boolean {
    const next: Record<string, string> = {};
    if (!details.reason.trim()) {
      next.reason = "Reason for requisition is required.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function goNext() {
    clearErrors();
    if (step === 2 && !validateStep2()) return;
    if (step === 3 && !validateStep3()) return;
    if (step === 4 && !validateStep4()) return;
    setStep((current) => (current < 5 ? ((current + 1) as 1 | 2 | 3 | 4 | 5) : current));
  }

  function goBack() {
    clearErrors();
    setStep((current) => (current > 1 ? ((current - 1) as 1 | 2 | 3 | 4 | 5) : current));
  }

  function jumpTo(target: 1 | 2 | 3 | 4 | 5) {
    clearErrors();
    setStep(target);
  }

  function buildTripFromJourney(): Trip {
    return {
      id: crypto.randomUUID(),
      date: journey.date,
      startTime: journey.startTime,
      endTime: journey.endTime,
      vehicleCategory: "Bus",
      route: `Campus to ${journey.destination.trim()} and Return to Campus`,
      stoppageSequence: ["Campus", journey.destination.trim(), "Campus"],
      passengerGroups: [],
      status: "Pending",
    };
  }

  function buildRequisition(status: Requisition["status"]): Requisition {
    const trips = status === "Draft" ? [] : [buildTripFromJourney()];
    const departmentOrOffice = requester.department ?? requester.office ?? "";
    const contactNumber = requester.mobile ?? transportUser.mobile;

    return {
      id: crypto.randomUUID(),
      requesterId: requester.id,
      requesterName:
        requester.fullName?.trim() || transportUser.fullName.trim() || requester.email,
      applicantType: "Individual",
      department: departmentOrOffice.trim() || undefined,
      contactNumber: contactNumber?.trim() || undefined,
      requisitionType: journey.requisitionType,
      purpose: details.reason.trim() || journey.purpose.trim(),
      startDate: journey.date,
      endDate: journey.date,
      scheduleType: "Single",
      status,
      createdAt: new Date().toISOString(),
      trips,
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
    // Re-validate every step before we commit — the user might have
    // skipped back-and-forth without re-checking later steps.
    if (!validateStep2()) {
      setStep(2);
      return;
    }
    if (!validateStep3()) {
      setStep(3);
      return;
    }
    if (!validateStep4()) {
      setStep(4);
      return;
    }

    setIsSubmitting(true);
    try {
      const finalStatus = requiresRecommender
        ? "Pending Recommendation"
        : "Pending Approval";

      const requisition = buildRequisition(finalStatus);
      addRequisition(requisition);
      onSubmit(requisition);

      // When the recommender workflow applies, notify the matching
      // DepartmentHead. The Admin notification is dispatched in
      // ApplyRequisitionPage after the requisition is added.
      if (requiresRecommender) {
        addNotification({
          id: crypto.randomUUID(),
          type: "New Requisition",
          message: `${requisition.requesterName} submitted an official requisition awaiting your recommendation.`,
          timestamp: new Date().toISOString(),
          linkType: "requisition",
          linkId: requisition.id,
          isRead: false,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-md border border-[#E2E8F0] bg-white p-4">
        <StepIndicator current={step} />
      </div>

      <div className="rounded-md border border-[#E2E8F0] bg-white p-5">
        {step === 1 && <Step1Requester requester={requester} />}

        {step === 2 && (
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
        )}

        {step === 3 && (
          <Step3Journey
            value={journey}
            onChange={setJourney}
            applicantProfile={requester.applicantProfile}
            errors={{
              date: errors.date,
              destination: errors.destination,
              purpose: errors.purpose,
            }}
          />
        )}

        {step === 4 && (
          <Step4Details
            value={details}
            onChange={setDetails}
            errors={{ reason: errors.reason }}
          />
        )}

        {step === 5 && (
          <Step5Recommendation
            requesterName={requester.fullName ?? requester.email}
            transportUser={transportUser}
            journey={journey}
            details={details}
            applicantProfile={requester.applicantProfile}
            requiresRecommendation={requiresRecommender}
            onSubmit={handleSubmit}
            onSaveDraft={handleSaveDraft}
            isSubmitting={isSubmitting}
          />
        )}
      </div>

      {step !== 5 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={step === 1 ? onCancel : goBack}
            className="h-10 rounded-md border border-[#E2E8F0] bg-white px-4 text-sm font-medium text-[#334E68] hover:bg-[#F8FAFC]"
          >
            {step === 1 ? "Cancel" : "Back"}
          </button>

          <div className="flex items-center gap-2">
            {step > 1 ? (
              <div className="hidden gap-1 sm:flex">
                {([1, 2, 3, 4] as const).map((target) => (
                  <button
                    key={target}
                    type="button"
                    onClick={() => jumpTo(target)}
                    className="h-8 rounded-md px-2 text-xs font-medium text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#1E293B]"
                  >
                    Step {target}
                  </button>
                ))}
              </div>
            ) : null}

            <button
              type="button"
              onClick={goNext}
              className="h-10 rounded-md bg-[#0F2747] px-4 text-sm font-medium text-white hover:bg-[#334E68]"
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
