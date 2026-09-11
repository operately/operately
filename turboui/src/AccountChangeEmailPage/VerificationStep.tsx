import React from "react";
import type { EmailChangeRequest } from "../ApiTypes";
import * as Forms from "../Forms";
import { ActionLink } from "../Link";
import type { AccountChangeEmailPage } from "./index";
import { FormActions, FormError, ResendCountdown, useFocusFields } from "./FormElements";

export type VerificationStepProps = Pick<
  AccountChangeEmailPage.Props,
  "busy" | "error" | "onCancelRequest" | "onExit"
> & {
  pending: EmailChangeRequest;
  retrySeconds: number;
  expired: boolean;
  authorizationExpired: boolean;
  resending: boolean;
  resentEmail: string | null;
  resendCode: () => Promise<void>;
};

interface Props extends VerificationStepProps {
  heading: string;
  instructions: React.ReactNode;
  testId: string;
  saveText: string;
  onVerify: (requestId: string, code: string) => Promise<boolean>;
}

export function VerificationStep(props: Props) {
  const { pending, busy, error, retrySeconds, expired, authorizationExpired } = props;
  const fieldsRef = useFocusFields(busy, props.resentEmail);
  const exhausted = pending.attemptsRemaining === 0;
  const unavailableMessage = authorizationExpired
    ? "Your verification has expired. Start again to verify your current email."
    : exhausted
      ? "Too many incorrect attempts. Request a new code to continue."
      : expired
        ? "This code has expired. Request a new code to continue."
        : null;
  const errorMessage = error ?? unavailableMessage;
  const form = Forms.useForm({
    fields: { code: "" },
    validate: (addError) => {
      if (!/^[A-Z0-9]{6}$/.test(form.values.code.trim().toUpperCase().replace(/[\s-]/g, ""))) {
        addError("code", "Enter the six-character code from your email.");
      }
    },
    submit: async () => {
      if (!busy && !expired && !exhausted && !authorizationExpired) await props.onVerify(pending.id, form.values.code);
    },
  });

  const cancel = async () => {
    if (await props.onCancelRequest(pending.id)) props.onExit();
  };

  return (
    <Forms.Form form={form} testId="email-change-verification">
      <div className="mb-6" id="verification-instructions" data-test-id={props.testId}>
        <h2 className="text-lg font-bold mb-2">{props.heading}</h2>
        <p>
          We sent a six-character code to<strong className="block break-all mt-1">{pending.codeRecipient}</strong>
        </p>
        <p className="mt-2 text-content-dimmed text-sm">{props.instructions}</p>
        <p className="mt-2 text-content-dimmed text-sm">Codes are valid for up to 5 minutes.</p>
      </div>
      <FormError error={error} unavailable={unavailableMessage} />
      <fieldset ref={fieldsRef} disabled={busy} aria-busy={busy} className="min-w-0">
        <Forms.FieldGroup>
          <Forms.InputField field="code" label="Verification code" error={form.errors.code}>
            <Forms.Input
              id="code"
              field="code"
              testId="verification-code"
              type="text"
              autoFocus
              autoComplete="one-time-code"
              autoCapitalize="characters"
              spellCheck={false}
              value={form.values.code}
              onChange={(event) => form.actions.setValue("code", event.target.value)}
              error={Boolean(form.errors.code)}
              aria-describedby={
                errorMessage ? "verification-instructions email-change-error" : "verification-instructions"
              }
              className="font-mono text-2xl tracking-widest max-w-64"
              disabled={expired || exhausted || authorizationExpired}
            />
          </Forms.InputField>
        </Forms.FieldGroup>
        <FormActions
          busy={busy}
          disabled={busy || expired || exhausted || authorizationExpired}
          saveText={props.saveText}
          onCancel={cancel}
        />
        <div className="mt-6 pt-5 border-t border-surface-outline">
          <p className="text-sm text-content-dimmed mb-3">
            Can’t find your code? Check your spam folder or request another.
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
            <ActionLink
              disabled={busy || retrySeconds > 0 || authorizationExpired}
              onClick={() => void props.resendCode()}
              testId="resend-email-code"
            >
              {props.resending ? "Sending code…" : "Resend code"}
            </ActionLink>
            <ActionLink
              onClick={() => void props.onCancelRequest(pending.id)}
              testId={authorizationExpired ? "restart-email-change" : "change-email-destination"}
              disabled={busy}
            >
              {authorizationExpired ? "Start again" : "Use a different email"}
            </ActionLink>
          </div>
          <p className="text-sm text-content-dimmed mt-3 break-words" role="status" aria-live="polite">
            {props.resending ? "Sending code…" : busy ? "Please wait…" : ""}
          </p>
        </div>
        <ResendCountdown seconds={retrySeconds} />
      </fieldset>
    </Forms.Form>
  );
}
