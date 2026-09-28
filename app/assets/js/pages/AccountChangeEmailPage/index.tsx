import React from "react";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
      setError(emailChangeError(result.outcome, t));
    } catch {
      setError(t("We couldn’t reach Operately. Check your connection and try again."));
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

function emailChangeError(outcome: Exclude<EmailChangeOutcome, "success">, t: TFunction) {
  switch (outcome) {
    case "invalid_email":
      return t("Enter a valid email address.");
    case "email_unchanged":
      return t("This is already your current email. Enter a different address.");
    case "email_taken":
      return t("This email is already registered. Use a different address.");
    case "rate_limited":
      return t("Please wait before requesting another code.");
    case "delivery_unavailable":
      return t("Email delivery isn’t configured. Contact your organization administrator for help.");
    case "delivery_failed":
      return t("We couldn’t send the code. Please try again.");
    case "request_invalid":
      return t("This request is no longer active. Review your current email or request a new code.");
    case "authorization_expired":
      return t("Your verification has expired. Start again to verify your current email.");
    case "code_expired":
      return t("This code has expired. Request a new code to continue.");
    case "invalid_code":
      return t("That code doesn’t match. Check your latest email and try again.");
    case "too_many_attempts":
      return t("Too many incorrect attempts. Request a new code to continue.");
  }
}
