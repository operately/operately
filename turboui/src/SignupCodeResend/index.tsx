import React from "react";
import { useTranslation } from "react-i18next";
import { ErrorMessage } from "../Forms/ErrorMessage";
import { ActionLink } from "../Link";

export namespace SignupCodeResend {
  export interface Props {
    email: string;
    state: "idle" | "sending" | "success" | "error";
    disabled?: boolean;
    onResend: () => void;
  }
}

export function SignupCodeResend({ email, state, disabled, onResend }: SignupCodeResend.Props) {
  const { t } = useTranslation();

  return (
    <div className="mt-8 text-center text-sm">
      <p className="mb-3">{t("Can’t find your code? Check your spam folder or request another.")}</p>
      <ActionLink disabled={disabled || state === "sending"} onClick={onResend} testId="resend-email-code">
        {state === "sending" ? t("Sending code…") : t("Resend code")}
      </ActionLink>
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
