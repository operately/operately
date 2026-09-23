import React from "react";
import { useTranslation } from "react-i18next";
import * as Forms from "../Forms";
import { InfoCallout } from "../Callouts";
import { translationText } from "../i18n";
import type { AccountChangeEmailPage } from "./index";
import { FormActions, FormError, ResendCountdown, useFocusFields } from "./FormElements";

type Props = Pick<
  AccountChangeEmailPage.Props,
  "busy" | "error" | "allowGoogleLogin" | "allowEmailLogin" | "onRequest" | "onExit"
> & {
  currentEmail: string;
  retrySeconds: number;
};

export function EnterEmailStep(props: Props) {
  const { t } = useTranslation();
  const { busy, error, retrySeconds } = props;
  const fieldsRef = useFocusFields(busy);
  const form = Forms.useForm({
    fields: { email: "" },
    validate: (addError) => {
      if (!/^[^\s@]+@[^\s@]+$/.test(form.values.email.trim())) addError("email", t("Enter a valid email address."));
    },
    submit: async () => {
      if (!busy && retrySeconds === 0) await props.onRequest(form.values.email.trim());
    },
  });

  return (
    <Forms.Form form={form} testId="email-change-entry">
      <div className="mb-6">
        <p className="text-sm text-content-dimmed">{t("Current email")}</p>
        <p className="font-semibold break-all mb-4" data-test-id="current-email">
          {props.currentEmail}
        </p>
        <p>
          {t(
            "First, we’ll send a code to your current email. After you verify it, we’ll send another to your new address.",
          )}
        </p>
        <p className="mt-2">
          {t(
            "You’ll need access to both inboxes. Your email won’t change until both are verified. This change applies to all your companies.",
          )}
        </p>
        {(props.allowGoogleLogin || props.allowEmailLogin) && (
          <div className="mt-4">
            <InfoCallout
              message={translationText(t("Signing in after the change"))}
              description={
                <div className="space-y-3">
                  {props.allowGoogleLogin && (
                    <p>
                      {t("If you sign in with Google, you’ll need to use a Google account with the new email address.")}
                    </p>
                  )}
                  {props.allowEmailLogin && (
                    <p>
                      {t(
                        "For email sign-in, use your new email and existing password after confirming. If you haven’t set a password, use “Forgot password” when signing in.",
                      )}
                    </p>
                  )}
                </div>
              }
            />
          </div>
        )}
      </div>
      <FormError error={error} />
      <fieldset ref={fieldsRef} disabled={busy} aria-busy={busy} className="min-w-0">
        <Forms.FieldGroup>
          <Forms.InputField field="email" label={t("New email")} error={form.errors.email}>
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
        </Forms.FieldGroup>
        <FormActions
          busy={busy}
          disabled={busy || retrySeconds > 0}
          saveText={t("Send verification code")}
          onCancel={props.onExit}
        />
        <ResendCountdown seconds={retrySeconds} />
      </fieldset>
    </Forms.Form>
  );
}
