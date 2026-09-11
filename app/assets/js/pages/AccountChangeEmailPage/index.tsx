import React from "react";
import Api, { EmailChangeOutcome, EmailChangeState } from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import {
  useRequestEmailChange,
  useConfirmEmailChange,
  useCancelEmailChange,
  useVerifyCurrentEmail,
  useResendEmailChange,
} from "@/models/accounts/emailChangeLifecycle";
import { usePaths } from "@/routes/paths";
import { PageModule } from "@/routes/types";
import { useNavigate } from "react-router";
import { AccountChangeEmailPage } from "turboui";

async function loader() {
  await Api.email_changes.getQuery({});
  return {};
}

export default { name: "AccountChangeEmailPage", loader, Page } as PageModule;

function Page() {
  const paths = usePaths();
  const navigate = useNavigate();
  const { data } = useLoadedQuery(Api.email_changes.getQueryOptions({}));
  const [completedEmail, setCompletedEmail] = React.useState<string | null>(null);
  const [confirmingState, setConfirmingState] = React.useState<EmailChangeState | null>(null);
  const request = useRequestEmailChange();
  const confirm = useConfirmEmailChange(setCompletedEmail);
  const cancel = useCancelEmailChange();
  const verifyCurrent = useVerifyCurrentEmail();
  const resend = useResendEmailChange();
  const [error, setError] = React.useState<string | null>(null);

  if (!data?.state) throw new Error("Email change settings are unavailable");

  const perform = async (action: () => Promise<{ outcome: EmailChangeOutcome }>) => {
    setError(null);
    try {
      const result = await action();
      if (result.outcome === "success") return true;
      setError(messages[result.outcome]);
    } catch {
      setError("We couldn’t reach Operately. Check your connection and try again.");
    }
    return false;
  };

  return (
    <AccountChangeEmailPage
      state={confirmingState ?? data.state}
      homePath={paths.homePath()}
      securityPath={paths.accountSecurityPath()}
      error={error}
      busy={request.isPending || confirm.isPending || cancel.isPending || verifyCurrent.isPending || resend.isPending}
      completedEmail={completedEmail}
      allowEmailLogin={window.appConfig.allowLoginWithEmail}
      allowGoogleLogin={window.appConfig.allowLoginWithGoogle}
      onRequest={(email) => perform(() => request.mutateAsync({ email }))}
      onVerifyCurrent={(requestId, code) => perform(() => verifyCurrent.mutateAsync({ requestId, code }))}
      onResend={(requestId) => perform(() => resend.mutateAsync({ requestId }))}
      onConfirm={async (requestId, code) => {
        // Keep verification visible while the cache replaces the pending request with the confirmed account.
        setConfirmingState(data.state);
        try {
          return await perform(() => confirm.mutateAsync({ requestId, code }));
        } finally {
          setConfirmingState(null);
        }
      }}
      onCancelRequest={(requestId) => perform(() => cancel.mutateAsync({ requestId }))}
      onExit={() => navigate(paths.accountSecurityPath())}
    />
  );
}

const messages: Record<Exclude<EmailChangeOutcome, "success">, string> = {
  invalid_email: "Enter a valid email address.",
  email_unchanged: "This is already your current email. Enter a different address.",
  email_taken: "This email is already registered. Use a different address.",
  rate_limited: "Please wait before requesting another code.",
  delivery_unavailable: "Email delivery isn’t configured. Contact your organization administrator for help.",
  delivery_failed: "We couldn’t send the code. Please try again.",
  request_invalid: "This request is no longer active. Review your current email or request a new code.",
  authorization_expired: "Your verification has expired. Start again to verify your current email.",
  code_expired: "This code has expired. Request a new code to continue.",
  invalid_code: "That code doesn’t match. Check your latest email and try again.",
  too_many_attempts: "Too many incorrect attempts. Request a new code to continue.",
};
