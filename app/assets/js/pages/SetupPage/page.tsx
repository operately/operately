import * as React from "react";
import { useTranslation } from "react-i18next";
import classNames from "classnames";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

import * as Companies from "@/models/companies";
import { logIn } from "@/routes/auth";
import { PasswordStrength } from "@/features/auth/PasswordStrength";
import { validatePassword } from "@/features/auth/validatePassword";
import { validateEmail } from "@/features/auth/validateEmail";
import { translationText } from "@/i18n";
import { Forms, Spacer } from "turboui";
import { OperatelyLogo } from "turboui/Logo";
import { Paths } from "@/routes/paths";

export function Page() {
  const { t } = useTranslation();

  return (
    <Pages.Page title={translationText(t("Welcome to Operately!"))}>
      <Paper.Root>
        <Paper.Body>
          <div className="grid grid-cols-[min-content_1fr] gap-x-4">
            <div className="row-span-2 pt-1">
              <OperatelyLogo width="48px" height="48px" />
            </div>
            <div className="text-content-accent text-2xl font-extrabold">{t("Welcome to Operately!")}</div>
            <div className="text-content-accent">{t("Let's set up your company.")}</div>
          </div>

          <Spacer size={6} />

          <Form />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Form() {
  const { t } = useTranslation();
  const [add] = Companies.useAddFirstCompany();
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const form = Forms.useForm({
    fields: {
      companyName: "",
      fullName: "",
      email: "",
      title: "",
      password: "",
      passwordConfirmation: "",
    },
    validate: (addError) => {
      const email = form.values.email.trim();
      if (email !== "" && !validateEmail(email)) {
        addError("email", t("Email must be a valid email address"));
      }

      if (form.values.password !== "" && !validatePassword(form.values.password).isValid) {
        addError(
          "password",
          t(
            "Password must be at least 12 characters and include a number, a lowercase letter, and an uppercase letter",
          ),
        );
      }

      if (form.values.password !== form.values.passwordConfirmation) {
        addError("passwordConfirmation", t("Passwords do not match"));
      }
    },
    submit: async () => {
      setSubmitError(null);
      const res = await add({
        companyName: form.values.companyName,
        fullName: form.values.fullName,
        email: form.values.email,
        title: form.values.title,
        password: form.values.password,
        passwordConfirmation: form.values.passwordConfirmation,
      });

      await logIn(form.values.email, form.values.password, { redirectTo: Paths.companyWorkMapPath(res.company.id) });
    },
    onError: (error) => {
      const data = error.response?.data as { error?: string; message?: string } | undefined;
      const message = data?.message;

      if (message) {
        setSubmitError(message);
      } else {
        setSubmitError(t("There was an unexpected error. Please try again later."));
      }
    },
  });

  const validation = validateForm(form.values);
  const isComplete = isFormComplete(form.values);
  const isSubmitting = form.state === "submitting";

  return (
    <Forms.Form form={form} preventSubmitOnEnter={!isComplete}>
      <Forms.FieldGroup>
        <Forms.TextInput
          field="companyName"
          label={translationText(t("Name of the company"))}
          placeholder={translationText(t("e.g. Acme Co."))}
          required
          minLength={3}
          okSign={validation.companyName}
          testId="company-name"
        />
      </Forms.FieldGroup>

      <AdminAccountTitle />

      <Forms.FieldGroup>
        <div className="space-y-6">
          <Forms.TextInput
            field="fullName"
            label={translationText(t("Full name"))}
            placeholder={translationText(t("e.g. John Johnson"))}
            required
            okSign={validation.fullName}
            testId="full-name"
          />
          <Forms.TextInput
            field="title"
            label={translationText(t("Title in the company"))}
            placeholder={translationText(t("e.g. Founder"))}
            required
            okSign={validation.title}
            testId="title"
          />
          <Forms.TextInput
            field="email"
            label={translationText(t("Email"))}
            placeholder={translationText(t("e.g. john@your-company.com"))}
            required
            maxLength={160}
            okSign={validation.email}
            testId="email"
          />
          <Forms.PasswordInput
            field="password"
            label={t("Password")}
            minLength={12}
            maxLength={72}
            placeholder={translationText(t("At least 12 characters"))}
            required
            noAutofill
            okSign={validation.password}
            testId="password"
          />
          <PasswordStrength password={form.values.password} />
          <Forms.PasswordInput
            field="passwordConfirmation"
            label={t("Repeat password")}
            minLength={12}
            maxLength={72}
            placeholder={translationText(t("At least 12 characters"))}
            required
            noAutofill
            okSign={validation.passwordConfirmation}
            testId="password-confirmation"
          />
        </div>
      </Forms.FieldGroup>

      {submitError && (
        <div className="mt-4" role="alert">
          <Forms.ErrorMessage error={submitError} />
        </div>
      )}

      <SubmitButton disabled={!isComplete || isSubmitting} submitting={isSubmitting} />
    </Forms.Form>
  );
}

function AdminAccountTitle() {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-2 my-16">
      <div className="bg-content-accent flex-1 h-[1px] bg-black"></div>
      <span className="text-content-accent text-center">{t("ADMIN ACCOUNT")}</span>
      <div className="bg-content-accent flex-1 h-[1px] bg-black"></div>
    </div>
  );
}

function SubmitButton({ disabled, submitting }: { disabled: boolean; submitting: boolean }) {
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

  const label = submitting ? t("Submitting...") : disabled ? t("Please fill in all fields") : t("Submit");

  return (
    <button className={className} type="submit" data-test-id="submit-form" disabled={disabled}>
      {label}
    </button>
  );
}

interface FormValues {
  companyName: string;
  fullName: string;
  email: string;
  title: string;
  password: string;
  passwordConfirmation: string;
}

interface FormValidation {
  companyName: boolean;
  fullName: boolean;
  email: boolean;
  title: boolean;
  password: boolean;
  passwordConfirmation: boolean;
}

function isFormComplete(values: FormValues): boolean {
  return (
    values.companyName.trim() !== "" &&
    values.fullName.trim() !== "" &&
    values.title.trim() !== "" &&
    values.email.trim() !== "" &&
    values.password.trim() !== "" &&
    values.passwordConfirmation.trim() !== ""
  );
}

function validateForm(values: FormValues): FormValidation {
  const companyName = values.companyName.trim().length >= 3;
  const fullName = values.fullName.trim() !== "";
  const title = values.title.trim() !== "";
  const email = validateEmail(values.email) && values.email.length <= 160;

  const passwordValidation = validatePassword(values.password);
  const password = passwordValidation.isValid && values.password.length <= 72;
  const passwordConfirmation = password && values.password === values.passwordConfirmation;

  return { companyName, fullName, email, title, password, passwordConfirmation };
}
