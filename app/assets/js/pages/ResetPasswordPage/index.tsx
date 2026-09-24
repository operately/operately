import * as Api from "@/api";
import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import { useTranslation } from "react-i18next";

import { Forms } from "turboui";
import classNames from "classnames";
import { OperatelyLogo } from "@/components/OperatelyLogo";
import { useNavigate } from "react-router";

import { validateEmail } from "@/features/auth/validateEmail";
import { validatePassword } from "@/features/auth/validatePassword";
import { PasswordStrength } from "@/features/auth/PasswordStrength";
import { translationText } from "@/i18n";
import { PageModule } from "@/routes/types";

export default { name: "ResetPasswordPage", loader: Pages.emptyLoader, Page } as PageModule;

function Page() {
  const { t } = useTranslation();
  const [reset] = Api.useResetPassword();
  const token = new URLSearchParams(window.location.search).get("token");
  const navigate = useNavigate();

  const form = Forms.useForm({
    fields: {
      email: "",
      password: "",
      confirmPassword: "",
    },
    validate: (addError) => {
      if (form.values.password !== form.values.confirmPassword) {
        addError("confirmPassword", t("Passwords do not match"));
      }
    },
    submit: async () => {
      await reset({
        email: form.values.email.trim(),
        password: form.values.password,
        passwordConfirmation: form.values.confirmPassword,
        resetPasswordToken: token,
      });

      navigate("/log_in");
    },
  });

  const okEmail = validateEmail(form.values.email);
  const okPassword = validatePassword(form.values.password).isValid;
  const okConfirmPassword = form.values.password !== "" && form.values.password === form.values.confirmPassword;
  const okForm = okEmail && okPassword && okConfirmPassword;

  return (
    <Pages.Page title={translationText(t("Reset Password"))} testId="reset-password-page">
      <Paper.Root size="tiny">
        <Paper.Body className="h-dvh sm:h-auto">
          <div className="py-8 sm:px-4 sm:py-4">
            <OperatelyLogo width="30px" height="30px" />
            <h1 className="text-2xl font-bold my-4">{t("Reset Password")}</h1>

            <Forms.Form form={form}>
              <Forms.FieldGroup>
                <Forms.TextInput
                  field="email"
                  label={translationText(t("Email"))}
                  placeholder={translationText(t("e.g. your@email.com"))}
                  required
                  okSign={okEmail}
                />

                <Forms.PasswordInput
                  field="password"
                  label={t("Password")}
                  placeholder={translationText(t("Enter your new password"))}
                  required
                  okSign={okPassword}
                />

                <Forms.PasswordInput
                  field="confirmPassword"
                  label={t("Confirm Password")}
                  placeholder={translationText(t("Re-enter your new password"))}
                  required
                  okSign={okConfirmPassword}
                />

                <PasswordStrength password={form.values.password} />
              </Forms.FieldGroup>

              <SubmitButton onClick={form.actions.submit} disabled={!okForm} />
            </Forms.Form>
          </div>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function SubmitButton({ onClick, disabled }) {
  const { t } = useTranslation();
  const className = classNames(
    "w-full flex justify-center py-2 px-4 mt-6",
    "border border-transparent",
    "rounded-md shadow-sm font-medium text-white-1",
    {
      "bg-blue-400 cursor-not-allowed": disabled,
      "bg-blue-600 hover:bg-blue-700": !disabled,
    },
  );

  return (
    <button className={className} onClick={onClick} type="submit" data-test-id="submit" disabled={disabled}>
      {disabled ? t("Please fill in all fields") : t("Reset Password")}
    </button>
  );
}
