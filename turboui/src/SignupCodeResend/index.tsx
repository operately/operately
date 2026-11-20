import React from "react";
import { useTranslation } from "react-i18next";
import { ErrorMessage } from "../Forms/ErrorMessage";
import { ActionLink } from "../Link";
import { tn } from "../i18n";

export namespace SignupCodeResend {
  export interface Props {
    email: string;
    state: "idle" | "sending" | "success" | "error";
    disabled?: boolean;
    retrySeconds?: number;
    onResend: () => void;
  }
}

export function SignupCodeResend({ email, state, disabled, retrySeconds = 0, onResend }: SignupCodeResend.Props) {
  const { t } = useTranslation();

  return (
    <div className="mt-8 text-center text-sm">
      <p className="mb-3">{t("Can’t find your code? Check your spam folder or request another.")}</p>
      <ActionLink
        disabled={disabled || state === "sending" || retrySeconds > 0}
        onClick={onResend}
        testId="resend-email-code"
      >
        {state === "sending" ? t("Sending code…") : t("Resend code")}
      </ActionLink>
      {retrySeconds > 0 && (
        <p className="text-content-dimmed mt-3" data-test-id="resend-countdown">
          {tn(
            "You can request another code in 1 second.",
            "You can request another code in {{count}} seconds.",
            retrySeconds,
          )}
        </p>
      )}
      <p
        className="text-content-dimmed mt-3 break-words"
        role="status"
        aria-live="polite"
        data-test-id="resend-code-status"
        data-state={state}
      >
        {state === "sending"
          ? t("Sending code…")
          : state === "success"
            ? t("New code sent to {{email}}.", { email })
            : ""}
      </p>
      {state === "error" && (
        <div role="alert" data-test-id="resend-code-error">
          <ErrorMessage error={t("We couldn’t send the code. Please try again.")} />
        </div>
      )}
    </div>
  );
}
