import React from "react";
import { useTranslation } from "react-i18next";
import * as Forms from "../Forms";
import { SecondaryButton } from "../Button";
import { tn } from "../i18n";

export function useFocusFields(busy: boolean, focusKey?: string | null) {
  const fieldsRef = React.useRef<HTMLFieldSetElement>(null);
  React.useEffect(() => {
    if (!busy) fieldsRef.current?.querySelector<HTMLInputElement>("input")?.focus();
  }, [busy, focusKey]);
  return fieldsRef;
}

export function FormError({ error, unavailable }: { error: string | null; unavailable?: string | null }) {
  const message = error ?? unavailable;
  if (!message) return null;
  return (
    <div className="mb-4" data-test-id={error ? "email-change-error" : "email-change-code-unavailable"}>
      <Forms.ErrorMessage id="email-change-error" error={message} />
    </div>
  );
}

export function FormActions({
  busy,
  disabled,
  saveText,
  onCancel,
}: {
  busy: boolean;
  disabled: boolean;
  saveText: string;
  onCancel: () => void | Promise<void>;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap gap-2 mt-6">
      <Forms.Submit disabled={disabled} saveText={saveText} containerClassName="mt-0" testId="submit-email-change" />
      <SecondaryButton
        type="button"
        size="sm"
        disabled={busy}
        onClick={() => void onCancel()}
        testId="cancel-email-change"
      >
        {t("Cancel")}
      </SecondaryButton>
    </div>
  );
}

export function ResendCountdown({ seconds }: { seconds: number }) {
  if (seconds <= 0) return null;
  return (
    <p className="text-sm text-content-dimmed mt-3" data-test-id="resend-countdown">
      {tn("You can request another code in 1 second.", "You can request another code in {{count}} seconds.", seconds)}
    </p>
  );
}
