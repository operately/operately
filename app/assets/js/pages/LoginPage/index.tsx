import Api from "@/api";
import * as Billing from "@/models/billing";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as React from "react";
import { Trans, useTranslation } from "react-i18next";

import { OperatelyLogo } from "@/components/OperatelyLogo";

import { SignInWithGoogleButton } from "@/features/auth/Buttons";
import { translationText } from "@/i18n";
import { logIn } from "@/routes/auth";
import { Paths } from "@/routes/paths";
import { PageModule } from "@/routes/types";
import classNames from "classnames";
import { Forms, DimmedLink, Link, type FormState } from "turboui";

export default { name: "LoginPage", loader: Pages.emptyLoader, Page } as PageModule;

function Page() {
  const { t } = useTranslation();
  const [error, setError] = React.useState<string | null>(null);
  const inviteToken = React.useMemo(() => new URLSearchParams(window.location.search).get("invite_token"), []);
  const redirectTo = React.useMemo(() => getRedirectTo(), []);

  const form = Forms.useForm({
    fields: {
      email: "",
      password: "",
    },
    submit: async () => {
      setError(null);

      const res = await logIn(form.values.email, form.values.password, {
        redirectTo: inviteToken ? null : redirectTo,
        skipRedirect: Boolean(inviteToken),
      });

      if (res === "failure") {
        setError(t("Invalid email or password"));
        return;
      }

      if (inviteToken) {
        try {
          const joinResult = await Api.invitations.joinCompanyViaInviteLink({ token: inviteToken });
          const companyId = joinResult.company?.id;

          if (companyId) {
            window.location.href = `/${companyId}`;
          } else {
            window.location.href = "/";
          }
        } catch (err) {
          console.error("Failed to join company via invite link after login", err);

          if (Billing.extractLimitError(err)?.code === "member_count_limit_exceeded") {
            window.location.href = Paths.inviteJoinFullPath(inviteToken);
            return;
          }

          setError(t("Something went wrong while joining. Please try again."));
        }
      }
    },
  });

  return (
    <Pages.Page title={translationText(t("Sign In"))} testId="login-page">
      <Paper.Root size="tiny">
        <Paper.Body className="h-dvh sm:h-auto">
          <div className="py-8 sm:px-4 sm:py-4">
            <OperatelyLogo width="40px" height="40px" />
            <h1 className="text-2xl font-bold mt-4">{t("Operately")}</h1>
            <p className="text-content-dimmed mb-8">{t("Please enter your details to sign in")}</p>

            <Forms.Form form={form}>
              {window.appConfig.allowLoginWithEmail && <EmailLogin form={form} error={error} />}
              {window.appConfig.allowLoginWithGoogle && <GoogleLogin />}

              {isSignupEnabled() && (
                <div className="mt-8 text-center text-sm font-medium">
                  <Trans
                    i18nKey="Don't have an account? <link>Create an account</link>"
                    components={{ link: <Link to="/sign_up" /> }}
                  />
                </div>
              )}
            </Forms.Form>
          </div>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function isSignupEnabled(): boolean {
  return window.appConfig.allowSignupWithEmail || window.appConfig.allowSignupWithGoogle;
}

function EmailLogin({ form, error }: { form: FormState<{ email: string; password: string }>; error: string | null }) {
  const { t } = useTranslation();

  return (
    <div>
      <Forms.FieldGroup>
        <Forms.TextInput field={"email"} label={translationText(t("Email"))} placeholder={translationText(t("your@email.com"))} required />
        <PasswordInput />
      </Forms.FieldGroup>

      {error && <div className="text-red-600 text-sm mt-2">{error}</div>}

      <div className="mt-8">
        <SubmitButton onClick={form.actions.submit} />
      </div>
    </div>
  );
}

function PasswordInput() {
  const { t } = useTranslation();

  return (
    <Forms.PasswordInput
      field={"password"}
      label={
        <div className="flex justify-between w-full">
          <span>{t("Password")}</span>
          <ForgotPasswordLink />
        </div>
      }
      placeholder={translationText(t("Password"))}
      required
    />
  );
}

function ForgotPasswordLink() {
  const { t } = useTranslation();

  return (
    <DimmedLink to={Paths.forgotPasswordPath()} className="text-sm font-normal" testId="forgot-password-link">
      {t("Forgot password?")}
    </DimmedLink>
  );
}

function GoogleLogin() {
  return (
    <div>
      {window.appConfig.allowLoginWithEmail && <OrSeparator />}
      <SignInWithGoogleButton />
    </div>
  );
}

function SubmitButton({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation();
  const className = classNames(
    "w-full flex justify-center py-2 px-4",
    "border border-transparent",
    "rounded-md shadow-sm font-medium text-white-1",
    "bg-blue-600 hover:bg-blue-700",
  );

  return (
    <button type="submit" className={className} onClick={onClick} data-test-id="submit">
      {t("Sign in")}
    </button>
  );
}

function OrSeparator() {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-4 my-6 text-content-dimmed uppercase text-xs font-medium tracking-wide">
      <div className="border-t border-stroke-base flex-1" />
      {t("or")}
      <div className="border-t border-stroke-base flex-1" />
    </div>
  );
}

function getRedirectTo(): string | null {
  const query = new URLSearchParams(window.location.search);
  const redirectTo = query.get("redirect_to");

  if (redirectTo) {
    const decoded = decodeURIComponent(redirectTo);

    return decoded.startsWith("/") ? decoded : null;
  } else {
    return null;
  }
}
