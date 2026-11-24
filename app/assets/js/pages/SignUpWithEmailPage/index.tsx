import { internalReturnPath, Paths } from "@/routes/paths";
import * as Accounts from "@/models/accounts";
import * as Billing from "@/models/billing";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as React from "react";
import { useTranslation } from "react-i18next";

import { OperatelyLogo } from "@/components/OperatelyLogo";
import { TosAndPrivacyPolicy } from "@/features/auth/AgreeToTosAndPp";
import { PasswordStrength } from "@/features/auth/PasswordStrength";
import {
  normalizeSignupEmail,
  trimSignupValue,
  validSignupEmail,
  validSignupName,
  validSignupPassword,
  signupPasswordFits,
} from "@/features/auth/signupValidation";

import { translationText } from "@/i18n";
import { logIn } from "@/routes/auth";
import { PageModule } from "@/routes/types";
import { match } from "ts-pattern";
import { Forms, SignupCodeResend, SecondaryButton, Trans } from "turboui";

export default { name: "SignUpWithEmailPage", loader: Pages.emptyLoader, Page } as PageModule;

type PageState = "form" | "code-verification";
type SignupFields = {
  inviteToken: string | null;
  email: string;
  name: string;
  password: string;
  confirmPassword: string;
  code: string;
};
type SignupForm = ReturnType<typeof Forms.useForm<SignupFields>>;

//
// The page is split into two states: "form" and "code-verification".
//
// On the "form" state, the user is asked to fill in their email, name, and password.
// When the user submits the form, an email with a verification code is sent to the
// user's email address. The page then transitions to the "code-verification" state.
//
// On the "code-verification" state, the user is asked to enter the verification code
// they received in their email. When the user submits the form, the account is created
// and the user is logged in.
//

function Page() {
  const { t } = useTranslation();
  const inviteToken = new URLSearchParams(window.location.search).get("invite_token");
  const redirectToParam = internalReturnPath(new URLSearchParams(window.location.search).get("redirect_to"));
  const [pageState, setPageState] = React.useState<PageState>("form");
  const [codeEmail, setCodeEmail] = React.useState<string | null>(null);
  const [focusField, setFocusField] = React.useState<string | null>(null);
  const [invitationError, setInvitationError] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const createEmailActivationCode = Accounts.useCreateEmailActivationCode();
  const createAccount = Accounts.useCreateAccount();
  const requestPending = React.useRef(false);
  const [resendState, setResendState] = React.useState<SignupCodeResend.Props["state"]>("idle");
  const [codeInputVersion, setCodeInputVersion] = React.useState(0);
  const [retryAt, setRetryAt] = React.useState(0);
  const [clock, setClock] = React.useState(Date.now);
  const retrySeconds = Math.max(0, Math.ceil((retryAt - clock) / 1000));
  const isCoolingDown = retrySeconds > 0;

  React.useEffect(() => {
    if (!isCoolingDown) return;
    const interval = window.setInterval(() => setClock(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [retryAt, isCoolingDown]);

  React.useEffect(() => {
    if (pageState === "form" && focusField) {
      document.getElementById(focusField)?.focus();
      setFocusField(null);
    }
  }, [pageState, focusField]);

  const handleSubmissionError = (error: unknown) => {
    const data = (
      error as { response?: { data?: { message?: unknown; details?: { field?: unknown; reason?: unknown } } } }
    )?.response?.data;
    const message = typeof data?.message === "string" && data.message.trim() ? data.message : null;
    const fields = { email: "email", full_name: "name", password: "password", code: "code" };
    const apiField = data?.details?.field;
    const field = typeof apiField === "string" ? fields[apiField as keyof typeof fields] : undefined;

    if (data?.details?.reason === "invite_link_domain_not_allowed") {
      setInvitationError(true);
    }

    if (field && message) {
      form.actions.addErrors({ [field]: message });
      if (field !== "code") {
        setPageState("form");
        setFocusField(field);
      }
      return;
    }

    if (apiField === "invite_token") {
      setPageState("form");
      setInvitationError(true);
    }
    setSubmitError(message ?? t("There was an unexpected error. Please try again later."));
  };

  const signupDetails = () => ({
    email: normalizeSignupEmail(form.values.email),
    fullName: trimSignupValue(form.values.name),
    password: form.values.password,
    inviteToken: form.values.inviteToken,
  });

  const startCooldown = () => {
    const now = Date.now();
    setClock(now);
    setRetryAt(now + 60_000);
  };

  const form = Forms.useForm({
    fields: {
      inviteToken,
      email: "",
      name: "",
      password: "",
      confirmPassword: "",
      code: "",
    },
    onChange: ({ field }) => {
      if (field && ["email", "name", "password", "confirmPassword", "code"].includes(field)) {
        setSubmitError(null);
      }
    },
    validate: (addError) => {
      if (pageState === "form") {
        if (!validSignupEmail(form.values.email)) {
          addError(
            "email",
            Array.from(normalizeSignupEmail(form.values.email)).length > 255
              ? t("Enter an email address with no more than 255 characters.")
              : t("Enter a valid email address."),
          );
        }
        if (!validSignupName(form.values.name)) {
          addError("name", t("Enter your full name using no more than 255 characters."));
        }
        if (!validSignupPassword(form.values.password)) {
          addError(
            "password",
            signupPasswordFits(form.values.password)
              ? t("Use at least 12 characters, including an uppercase letter, a lowercase letter, and a number.")
              : t("Use a password with no more than 72 UTF-8 bytes. Some characters use more than one byte."),
          );
        }
      }

      if (form.values.password !== form.values.confirmPassword) {
        addError("confirmPassword", t("Passwords do not match"));
      }
    },
    submit: async () => {
      if (requestPending.current) return false;
      requestPending.current = true;

      try {
        if (pageState === "form") {
          setSubmitError(null);

          const email = normalizeSignupEmail(form.values.email);
          if (codeEmail !== email) {
            await createEmailActivationCode.mutateAsync(signupDetails());
            form.actions.setValue("code", "");
            setCodeEmail(email);
            startCooldown();
          }
          setPageState("code-verification");
        } else {
          setSubmitError(null);

          const result = await createAccount.mutateAsync({
            code: form.values.code,
            ...signupDetails(),
          });

          const redirectTo = buildPostSignupRedirect({
            inviteToken: form.values.inviteToken,
            companyId: result.company?.id,
            joinErrorDetails: result.joinErrorDetails,
            redirectToParam,
          });

          if (result.error) {
            console.warn("createAccount invite join warning", result.error);
          }

          await logIn(normalizeSignupEmail(form.values.email), form.values.password, { redirectTo });
        }
        return true;
      } catch (error) {
        handleSubmissionError(error);
        return false;
      } finally {
        createEmailActivationCode.reset();
        createAccount.reset();
        requestPending.current = false;
      }
    },
  });

  const resendCode = async () => {
    if (requestPending.current || form.state !== "idle" || Date.now() < retryAt) return;
    requestPending.current = true;
    startCooldown();
    setResendState("sending");

    try {
      await createEmailActivationCode.mutateAsync(signupDetails());
      form.actions.setValue("code", "");
      form.actions.clearErrors();
      setSubmitError(null);
      setResendState("success");
      // Remount to focus the input and reset any rejected edit held by its validator.
      setCodeInputVersion((version) => version + 1);
    } catch (error) {
      handleSubmissionError(error);
      setResendState("error");
    } finally {
      createEmailActivationCode.reset();
      requestPending.current = false;
    }
  };

  return match(pageState)
    .with("form", () => (
      <Form
        form={form}
        submitError={submitError}
        invitationError={invitationError}
        onSkipInvitation={() => {
          form.actions.setValue("inviteToken", null);
          setInvitationError(false);
          setSubmitError(null);
        }}
      />
    ))
    .with("code-verification", () => (
      <CodeVerification
        form={form}
        submitError={submitError}
        codeInputVersion={codeInputVersion}
        onEditDetails={() => {
          setSubmitError(null);
          form.actions.clearErrors();
          setPageState("form");
          setFocusField("email");
        }}
        resend={{
          email: form.values.email,
          state: resendState,
          retrySeconds,
          disabled: form.state !== "idle",
          onResend: () => void resendCode(),
        }}
      />
    ))
    .exhaustive();
}

function Form({
  form,
  submitError,
  invitationError,
  onSkipInvitation,
}: {
  form: SignupForm;
  submitError: string | null;
  invitationError: boolean;
  onSkipInvitation: () => void;
}) {
  const { t } = useTranslation();
  const validation = validateForm(form);

  return (
    <Pages.Page title={translationText(t("Sign Up"))} testId="sign-up-page">
      <Paper.Root size="tiny">
        <Paper.Body className="h-dvh sm:h-auto">
          <div className="py-8 sm:px-4 sm:py-4">
            <OperatelyLogo width="40px" height="40px" />
            <h1 className="text-2xl font-bold mt-4">{t("Sign up for Operately")}</h1>
            <p className="text-content-dimmed mb-8">{t("Use your work email — keep work and life separate.")}</p>

            <Forms.Form form={form}>
              {submitError && (
                <div className="mb-4" role="alert">
                  <Forms.ErrorMessage error={submitError} />
                </div>
              )}

              {invitationError && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {form.values.inviteToken && (
                    <SecondaryButton
                      linkTo={`/log_in?invite_token=${encodeURIComponent(form.values.inviteToken)}`}
                      testId="invitation-sign-in"
                    >
                      {t("Sign in")}
                    </SecondaryButton>
                  )}
                  <SecondaryButton onClick={onSkipInvitation} testId="skip-invitation">
                    {t("Continue without this invitation")}
                  </SecondaryButton>
                </div>
              )}

              <Forms.FieldGroup>
                <Forms.TextInput
                  field={"email"}
                  label={translationText(t("Work Email"))}
                  placeholder={translationText(t("name@company.com"))}
                  required
                  okSign={validation.email}
                  onChange={() => form.actions.removeErrors(["email"])}
                />

                <Forms.TextInput
                  field={"name"}
                  label={translationText(t("Full Name"))}
                  placeholder={translationText(t("Enter your full name"))}
                  required
                  okSign={validation.name}
                />

                <Forms.PasswordInput
                  field={"password"}
                  label={t("Password")}
                  minLength={12}
                  placeholder={translationText(t("At least 12 characters"))}
                  required
                  noAutofill
                  okSign={validation.password}
                />

                <PasswordStrength password={form.values.password} />

                <Forms.PasswordInput
                  field={"confirmPassword"}
                  label={t("Confirm Password")}
                  minLength={12}
                  placeholder={translationText(t("At least 12 characters"))}
                  required
                  noAutofill
                  okSign={validation.confirmPassword}
                />
              </Forms.FieldGroup>

              <div className="my-6">
                <Forms.Submit
                  saveText={
                    !validation.isValid
                      ? translationText(t("Please fill in all fields"))
                      : translationText(t("Continue ->"))
                  }
                  className="w-full py-2 px-4"
                />
              </div>

              <TosAndPrivacyPolicy />
            </Forms.Form>
          </div>
        </Paper.Body>
        <WhatHappensNext />
      </Paper.Root>
    </Pages.Page>
  );
}

function WhatHappensNext() {
  return (
    <div className="my-8 text-center px-20">
      <Trans
        i18nKey="<bold>What happens next?</bold> Operately will send you a code to verify your email address."
        components={{ bold: <span className="font-bold" /> }}
      />
    </div>
  );
}

function CodeVerification({
  form,
  submitError,
  codeInputVersion,
  resend,
  onEditDetails,
}: {
  form: SignupForm;
  submitError: string | null;
  codeInputVersion: number;
  resend: SignupCodeResend.Props;
  onEditDetails: () => void;
}) {
  const { t } = useTranslation();

  return (
    <Pages.Page title={translationText(t("Sign Up"))} testId="sign-up-page">
      <Paper.Root size="tiny">
        <Paper.Body className="h-dvh sm:h-auto">
          <Forms.Form form={form}>
            <div className="py-8 sm:px-4 sm:py-4 flex flex-col items-center text-center">
              <OperatelyLogo width="32px" height="32px" />
              <h1 className="text-3xl font-bold mt-4 mb-4">{t("Check your email for a code")}</h1>
              <CodeMessage />

              {submitError && (
                <div className="mb-4 w-60" role="alert">
                  <Forms.ErrorMessage error={submitError} />
                </div>
              )}

              <div className="flex flex-col items-center">
                <div className="w-60">
                  <Forms.FieldGroup>
                    <Forms.VerificationCodeInput
                      key={codeInputVersion}
                      field="code"
                      autoFocus
                      testId="code"
                      className="text-4xl text-center text-content-base"
                    />
                  </Forms.FieldGroup>
                </div>
                <Forms.Submit
                  saveText={translationText(t("Continue ->"))}
                  className="w-60"
                  disabled={resend.state === "sending"}
                />
              </div>

              <SignupCodeResend {...resend} />
              <SecondaryButton
                onClick={onEditDetails}
                disabled={form.state !== "idle" || resend.state === "sending"}
                testId="edit-signup-details"
              >
                {t("Edit signup details")}
              </SecondaryButton>
            </div>
          </Forms.Form>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function CodeMessage() {
  const [email] = Forms.useFieldValue<string>("email");

  return (
    <p className="text-content-dimmed mb-8">
      <Trans
        i18nKey="We've sent you a 6-character code to <email>{{email}}</email>. The code expires in 5 minutes, so please enter it soon."
        values={{ email }}
        components={{ email: <span className="font-bold" /> }}
      />
    </p>
  );
}

interface FormValidation {
  email: boolean;
  name: boolean;
  password: boolean;
  confirmPassword: boolean;
  isValid: boolean;
}

function validateForm(form: SignupForm): FormValidation {
  const email = validSignupEmail(form.values.email);
  const name = validSignupName(form.values.name);
  const password = validSignupPassword(form.values.password);
  const confirmPassword = password && form.values.password === form.values.confirmPassword;

  const isValid = email && name && password && confirmPassword;

  return { email, name, password, confirmPassword, isValid };
}

function buildPostSignupRedirect({
  inviteToken,
  companyId,
  joinErrorDetails,
  redirectToParam,
}: {
  inviteToken: string | null;
  companyId?: string | null;
  joinErrorDetails?: unknown;
  redirectToParam: string | null;
}) {
  const joinLimitError = Billing.extractLimitErrorDetails(joinErrorDetails);

  if (joinLimitError?.code === "member_count_limit_exceeded" && inviteToken) {
    return Paths.inviteJoinFullPath(inviteToken);
  }

  if (companyId) {
    return `/${companyId}`;
  }

  return internalReturnPath(redirectToParam) || "/";
}
