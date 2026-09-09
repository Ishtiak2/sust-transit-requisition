import { useEffect } from "react";

import type { UserAccount } from "../../types";
import { ERROR_TEXT, FIELD_LABEL, FIELD_UNDERLINE } from "./formTheme";

export interface TransportUserDraft {
  fullName: string;
  designation: string;
  mobile: string;
}

interface Step2TransportUserProps {
  requester: UserAccount;
  value: TransportUserDraft;
  sameAsRequester: boolean;
  onSameAsRequesterChange: (next: boolean) => void;
  onChange: (next: TransportUserDraft) => void;
  errors?: Partial<Record<keyof TransportUserDraft, string>>;
}

/**
 * Step 2 — collects who will physically use the transport. Defaults to
 * "same as requester" so most applications need only one extra click.
 */
export default function Step2TransportUser({
  requester,
  value,
  sameAsRequester,
  onSameAsRequesterChange,
  onChange,
  errors = {},
}: Step2TransportUserProps) {
  useEffect(() => {
    if (!sameAsRequester) return;
    onChange({
      fullName: requester.fullName ?? "",
      designation: requester.designation ?? "",
      mobile: requester.mobile ?? "",
    });
    // We intentionally re-sync only when sameAsRequester flips on or the
    // requester identity changes; downstream edits are user-driven.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sameAsRequester, requester.id]);

  function handleSameAsRequester(next: boolean) {
    onSameAsRequesterChange(next);
    if (next) {
      onChange({
        fullName: requester.fullName ?? "",
        designation: requester.designation ?? "",
        mobile: requester.mobile ?? "",
      });
    }
  }

  function handleField<K extends keyof TransportUserDraft>(
    field: K,
    nextValue: TransportUserDraft[K],
  ) {
    onChange({ ...value, [field]: nextValue });
  }

  return (
    <section className="space-y-4">
      <label className="flex items-center gap-2 text-sm text-form-ink">
        <input
          type="checkbox"
          checked={sameAsRequester}
          onChange={(event) => handleSameAsRequester(event.target.checked)}
          className="h-4 w-4 rounded-none border-form-rule text-primary focus:ring-primary"
        />
        Transport user is the same as the requester
      </label>

      <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
        <div>
          <label className={FIELD_LABEL}>Full name</label>
          <input
            value={value.fullName}
            onChange={(event) => handleField("fullName", event.target.value)}
            disabled={sameAsRequester}
            className={`${FIELD_UNDERLINE} disabled:text-form-muted`}
          />
          {errors.fullName ? <p className={ERROR_TEXT}>{errors.fullName}</p> : null}
        </div>

        <div>
          <label className={FIELD_LABEL}>Mobile number</label>
          <input
            type="tel"
            value={value.mobile}
            onChange={(event) => handleField("mobile", event.target.value)}
            disabled={sameAsRequester}
            className={`${FIELD_UNDERLINE} disabled:text-form-muted`}
          />
          {errors.mobile ? <p className={ERROR_TEXT}>{errors.mobile}</p> : null}
        </div>

        <div className="sm:col-span-2">
          <label className={FIELD_LABEL}>Designation (optional)</label>
          <input
            value={value.designation}
            onChange={(event) =>
              handleField("designation", event.target.value)
            }
            disabled={sameAsRequester}
            className={`${FIELD_UNDERLINE} disabled:text-form-muted sm:w-1/2`}
          />
          {errors.designation ? (
            <p className={ERROR_TEXT}>{errors.designation}</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
