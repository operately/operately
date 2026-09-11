import React from "react";
import type { EmailChangeState } from "../ApiTypes";
import { Page } from "../Page";
import { showSuccessToast } from "../Toasts";
import { EnterEmailStep } from "./EnterEmailStep";
import { VerifyCurrentEmailStep } from "./VerifyCurrentEmailStep";
import { VerifyNewEmailStep } from "./VerifyNewEmailStep";
import { SuccessStep } from "./SuccessStep";

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
    onVerifyCurrent: (requestId: string, code: string) => Promise<boolean>;
    onResend: (requestId: string) => Promise<boolean>;
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

  React.useEffect(() => {
    if (resentEmail && resentEmail !== state.pending?.codeRecipient) setResentEmail(null);
  }, [state.pending?.codeRecipient, resentEmail]);

  const resendCode = async () => {
    if (!state.pending || props.busy || resending || retrySeconds > 0) return;
    const email = state.pending.codeRecipient;
    setResending(true);
    setResentEmail(null);
    try {
      if (await props.onResend(state.pending.id)) {
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
          <SuccessStep email={props.completedEmail} securityPath={props.securityPath} />
        ) : (
          <>
            <h1 className="mb-2 text-content-accent text-3xl font-extrabold">Change email</h1>
            <p className="text-content-dimmed text-sm mb-6" data-test-id="email-change-step">
              {!state.pending
                ? "Step 1 of 3 · Enter your new email"
                : state.pending.stage === "current_email"
                  ? "Step 2 of 3 · Verify your current email"
                  : "Step 3 of 3 · Verify your new email"}
            </p>
            <EmailChangeStep
              key={state.pending?.id ?? "new-email"}
              {...props}
              busy={props.busy || resending}
              retrySeconds={retrySeconds}
              clock={clock}
              resending={resending}
              resentEmail={resentEmail}
              resendCode={resendCode}
            />
          </>
        )}
      </div>
    </Page>
  );
}

function EmailChangeStep(
  props: AccountChangeEmailPage.Props & {
    retrySeconds: number;
    clock: number;
    resending: boolean;
    resentEmail: string | null;
    resendCode: () => Promise<void>;
  },
) {
  const pending = props.state.pending;
  if (!pending) return <EnterEmailStep {...props} currentEmail={props.state.currentEmail} />;

  const verificationProps = {
    ...props,
    pending,
    expired: Date.parse(pending.expiresAt) <= props.clock,
    authorizationExpired: Boolean(
      pending.authorizationExpiresAt && Date.parse(pending.authorizationExpiresAt) <= props.clock,
    ),
  };

  switch (pending.stage) {
    case "current_email":
      return <VerifyCurrentEmailStep {...verificationProps} />;
    case "new_email":
      return <VerifyNewEmailStep {...verificationProps} />;
  }
}
