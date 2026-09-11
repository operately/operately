import React from "react";
import type { EmailChangeState } from "../ApiTypes";
import * as Forms from "../Forms";
import { Page } from "../Page";
import { PrimaryButton, SecondaryButton } from "../Button";
import { InfoCallout } from "../Callouts";
import { ActionLink } from "../Link";
import { showSuccessToast } from "../Toasts";
import { formatNumber } from "../utils/formatting";

export namespace AccountChangeEmailPage {
  export interface Props {
    state: EmailChangeState;
    homePath: string;
    securityPath: string;
    error: string | null;
    busy: boolean;
    completedEmail: string | null;
    allowEmailLogin: boolean;
    allowGoogleLogin: boolean;
    onRequest: (email: string) => Promise<boolean>;
    onConfirm: (requestId: string, code: string) => Promise<boolean>;
    onCancelRequest: (requestId: string) => Promise<boolean>;
    onExit: () => void;
  }
}

export function AccountChangeEmailPage(props: AccountChangeEmailPage.Props) {
  const { state } = props;
  const [resending, setResending] = React.useState(false);
  const [resentEmail, setResentEmail] = React.useState<string | null>(null);
  const [clock, setClock] = React.useState(Date.now);
  const retryAt = React.useMemo(() => Date.now() + state.retryAfter * 1000, [state]);

  React.useEffect(() => {
    const timer = setInterval(() => setClock(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const retrySeconds = Math.max(0, Math.ceil((retryAt - clock) / 1000));
  const expired = state.pending ? Date.parse(state.pending.expiresAt) <= clock : false;

  React.useEffect(() => {
    if (resentEmail && resentEmail !== state.pending?.email) setResentEmail(null);
  }, [state.pending?.email, resentEmail]);

  const resendCode = async () => {
    if (!state.pending || props.busy || resending || retrySeconds > 0) return;
    const email = state.pending.email;
    setResending(true);
    setResentEmail(null);
    try {
      if (await props.onRequest(email)) {
        setResentEmail(email);
        showSuccessToast("Code sent", `New code sent to ${email}.`);
      }
    } finally {
      setResending(false);
    }
  };

  return (
    <Page
      title="Change email"
      size="small"
      testId="change-email-page"
      navigation={[
        { to: props.homePath, label: "Home" },
        { to: props.securityPath, label: "Password & Security" },
      ]}
    >
      <div className="px-4 sm:px-10 py-8">
        {props.completedEmail ? (
          <Success email={props.completedEmail} securityPath={props.securityPath} />
        ) : (
          <>
            <h1 className="mb-2 text-content-accent text-3xl font-extrabold">Change email</h1>
            <p className="text-content-dimmed text-sm mb-6" data-test-id="email-change-step">
              {state.pending ? "Step 2 of 2 · Verify your new email" : "Step 1 of 2 · Enter your new email"}
            </p>
            <EmailForm
              key={state.pending?.id ?? "new-email"}
              {...props}
              busy={props.busy || resending}
              retrySeconds={retrySeconds}
              expired={expired}
              resending={resending}
              resentEmail={resentEmail}
              onResend={resendCode}
            />
          </>
        )}
      </div>
    </Page>
  );
}

function EmailForm(
  props: AccountChangeEmailPage.Props & {
    retrySeconds: number;
    expired: boolean;
    resending: boolean;
    resentEmail: string | null;
    onResend: () => Promise<void>;
  },
) {
  const { state, busy, error, retrySeconds, expired } = props;
  const fieldsRef = React.useRef<HTMLFieldSetElement>(null);
  React.useEffect(() => {
    if (!busy && props.resentEmail) {
      fieldsRef.current?.querySelector<HTMLInputElement>('input[name="code"]')?.focus();
    }
  }, [busy, props.resentEmail]);

  const pending = state.pending;
  const exhausted = pending?.attemptsRemaining === 0;
  const unavailableMessage = exhausted
    ? "Too many incorrect attempts. Request a new code to continue."
    : expired
      ? "This code has expired. Request a new code to continue."
      : null;
  const errorMessage = error ?? unavailableMessage;
  const form = Forms.useForm({
    fields: { email: "", code: "" },
    validate: (addError) => {
      if (pending) {
        if (!/^[A-Z0-9]{6}$/.test(form.values.code.trim().toUpperCase().replace(/[\s-]/g, ""))) {
          addError("code", "Enter the six-character code from your email.");
        }
      } else if (!/^[^\s@]+@[^\s@]+$/.test(form.values.email.trim())) {
        addError("email", "Enter a valid email address.");
      }
    },
    submit: async () => {
      if (busy) return;
      if (pending) {
        if (!expired && !exhausted) await props.onConfirm(pending.id, form.values.code);
      } else if (retrySeconds === 0) {
        await props.onRequest(form.values.email.trim());
      }
    },
  });

  const cancel = async () => {
    if (!pending || (await props.onCancelRequest(pending.id))) props.onExit();
  };

  return (
    <Forms.Form form={form} testId={pending ? "email-change-verification" : "email-change-entry"}>
      {pending ? (
        <div className="mb-6" id="verification-instructions">
          <h2 className="text-lg font-bold mb-2">Check your new inbox</h2>
          <p>
            We sent a six-character code to
            <strong className="block break-all mt-1">{pending.email}</strong>
          </p>
          <p className="mt-2 text-content-dimmed text-sm">
            Codes expire 5 minutes after they’re sent. Your current email stays active until you confirm.
          </p>
        </div>
      ) : (
        <div className="mb-6">
          <p className="text-sm text-content-dimmed">Current email</p>
          <p className="font-semibold break-all mb-4" data-test-id="current-email">
            {state.currentEmail}
          </p>
          <p>Your email won’t change until you verify the new address. This change applies to all your companies.</p>
          {(props.allowGoogleLogin || props.allowEmailLogin) && (
            <div className="mt-4">
              <InfoCallout
                message="Signing in after the change"
                description={
                  <div className="space-y-3">
                    {props.allowGoogleLogin && (
                      <p>If you sign in with Google, you’ll need to use a Google account with the new email address.</p>
                    )}
                    {props.allowEmailLogin && (
                      <p>
                        For email sign-in, use your new email and existing password after confirming. If you haven’t set
                        a password, use “Forgot password” when signing in.
                      </p>
                    )}
                  </div>
                }
              />
            </div>
          )}
        </div>
      )}

      {errorMessage && (
        <div className="mb-4" data-test-id={error ? "email-change-error" : "email-change-code-unavailable"}>
          <Forms.ErrorMessage id="email-change-error" error={errorMessage} />
        </div>
      )}

      <fieldset ref={fieldsRef} disabled={busy} aria-busy={busy} className="min-w-0">
        <Forms.FieldGroup>
          {pending ? (
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
                disabled={expired || exhausted}
              />
            </Forms.InputField>
          ) : (
            <Forms.InputField field="email" label="New email" error={form.errors.email}>
              <Forms.Input
                id="email"
                field="email"
                testId="new-email"
                type="email"
                autoFocus
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                maxLength={160}
                value={form.values.email}
                onChange={(event) => form.actions.setValue("email", event.target.value)}
                error={Boolean(form.errors.email)}
                aria-describedby={error ? "email-change-error" : undefined}
              />
            </Forms.InputField>
          )}
        </Forms.FieldGroup>

        <div className="flex flex-wrap gap-2 mt-6">
          <Forms.Submit
            disabled={busy || (pending ? expired || exhausted : retrySeconds > 0)}
            saveText={pending ? "Confirm email change" : "Send verification code"}
            containerClassName="mt-0"
            testId="submit-email-change"
          />
          <SecondaryButton
            type="button"
            size="sm"
            disabled={busy}
            onClick={() => void cancel()}
            testId="cancel-email-change"
          >
            Cancel
          </SecondaryButton>
        </div>

        {pending ? (
          <div className="mt-6 pt-5 border-t border-surface-outline">
            <p className="text-sm text-content-dimmed mb-3">
              Can’t find your code? Check your spam folder or request another.
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
              <ActionLink
                disabled={busy || retrySeconds > 0}
                onClick={() => void props.onResend()}
                testId="resend-email-code"
              >
                {props.resending ? "Sending code…" : "Resend code"}
              </ActionLink>
              <ActionLink
                onClick={() => void props.onCancelRequest(pending.id)}
                testId="change-email-destination"
                disabled={busy}
              >
                Use a different email
              </ActionLink>
            </div>
            <p className="text-sm text-content-dimmed mt-3 break-words" role="status" aria-live="polite">
              {props.resending ? "Sending code…" : busy ? "Please wait…" : ""}
            </p>
          </div>
        ) : null}
        {retrySeconds > 0 && (
          <p className="text-sm text-content-dimmed mt-3" data-test-id="resend-countdown">
            You can request another code in {formatNumber(retrySeconds)} {retrySeconds === 1 ? "second" : "seconds"}.
          </p>
        )}
      </fieldset>
    </Forms.Form>
  );
}

function Success({ email, securityPath }: { email: string; securityPath: string }) {
  const heading = React.useRef<HTMLHeadingElement>(null);
  React.useEffect(() => heading.current?.focus(), []);

  return (
    <div data-test-id="email-change-success">
      <h1 ref={heading} tabIndex={-1} className="mb-3 text-content-accent text-3xl font-extrabold outline-none">
        Email changed
      </h1>
      <p>
        Your account email is now <strong className="break-all">{email}</strong>.
      </p>
      <p className="mt-3 mb-6 text-content-dimmed">
        It’s updated across all your companies. You’re still signed in. We’ll notify your previous address about this
        change.
      </p>
      <PrimaryButton linkTo={securityPath} size="sm" testId="email-change-done">
        Back to Password & Security
      </PrimaryButton>
    </div>
  );
}
