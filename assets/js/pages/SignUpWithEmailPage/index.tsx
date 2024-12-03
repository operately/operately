import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Api from "@/api";

import Forms from "@/components/Forms";
import classNames from "classnames";

import { OperatelyLogo } from "@/components/OperatelyLogo";
import { TosAndPrivacyPolicy } from "@/features/SignUp/AgreeToTosAndPp";
import { PasswordStrength, validatePassword } from "@/features/SignUp/PasswordStrength";

import { match } from "ts-pattern";
import { useFieldValue } from "@/components/Forms/FormContext";
import { logIn } from "@/routes/auth";

export const loader = Pages.emptyLoader;

type PageState = "form" | "code-verification";

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

export function Page() {
  const [pageState, setPageState] = React.useState<PageState>("form");

  const form = Forms.useForm({
    fields: {
      email: "",
      name: "",
      password: "",
      confirmPassword: "",
      code: "",
    },
    validate: (addError) => {
      if (form.values.password !== form.values.confirmPassword) {
        addError("confirmPassword", "Passwords do not match");
      }
    },
    submit: async () => {
      if (pageState === "form") {
        await Api.createEmailActivationCode({ email: form.values.email });
        setPageState("code-verification");
      } else {
        await Api.createAccount({
          code: form.values.code,
          email: form.values.email,
          fullName: form.values.name,
          password: form.values.password,
        });

        logIn(form.values.email, form.values.password, { redirectTo: "/" });
      }
    },
  });

  return match(pageState)
    .with("form", () => <Form form={form} />)
    .with("code-verification", () => <CodeVerification form={form} />)
    .exhaustive();
}

function Form({ form }) {
  const validation = validateForm(form);

  return (
    <Pages.Page title={["Sign Up"]} testId="sign-up-page">
      <Paper.Root size="tiny">
        <Paper.Body className="h-dvh sm:h-auto">
          <div className="py-8 sm:px-4 sm:py-4">
            <OperatelyLogo width="40px" height="40px" />
            <h1 className="text-2xl font-bold mt-4">Sign up for Operately</h1>
            <p className="text-content-dimmed mb-8">Use your work email — keep work and life separate.</p>

            <Forms.Form form={form}>
              <Forms.FieldGroup>
                <Forms.TextInput
                  field={"email"}
                  label="Work Email"
                  placeholder="name@company.com"
                  required
                  okSign={validation.email}
                />

                <Forms.TextInput
                  field={"name"}
                  label="Full Name"
                  placeholder="Enter your full name"
                  required
                  okSign={validation.name}
                />

                <Forms.PasswordInput
                  field={"password"}
                  label="Password"
                  minLength={12}
                  placeholder="At least 12 characters"
                  required
                  noAutofill
                  okSign={validation.password}
                />

                <PasswordStrength password={form.values.password} />

                <Forms.PasswordInput
                  field={"confirmPassword"}
                  label="Confirm Password"
                  minLength={12}
                  placeholder="At least 12 characters"
                  required
                  noAutofill
                  okSign={validation.confirmPassword}
                />
              </Forms.FieldGroup>

              <div className="my-6">
                <SubmitButton onClick={form.actions.submit} disabled={!validation.isValid} />
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
      <span className="font-bold">What happens next?</span> Operately will send you a code to verify your email address.
    </div>
  );
}

function SubmitButton({ onClick, disabled }) {
  const className = classNames(
    "w-full flex justify-center py-2 px-4",
    "border border-transparent",
    "rounded-md shadow-sm font-medium text-white-1",
    "bg-blue-600 hover:bg-blue-700",
    {
      "bg-blue-400 cursor-not-allowed": disabled,
    },
  );

  return (
    <button className={className} onClick={onClick} type="submit" data-test-id="submit" disabled={disabled}>
      {disabled ? "Please fill in all fields" : "Continue ->"}
    </button>
  );
}

function CodeVerification({ form }) {
  return (
    <Pages.Page title={["Sign Up"]} testId="sign-up-page">
      <Paper.Root size="tiny">
        <Paper.Body className="h-dvh sm:h-auto">
          <div className="py-8 sm:px-4 sm:py-4">
            <div className="flex flex-col items-center text-center">
              <OperatelyLogo width="32px" height="32px" />
              <h1 className="text-3xl font-bold mt-4 mb-4">Check your email for a code</h1>
              <p className="text-content-dimmed mb-8">
                We've sent you a 6-character code to <span className="font-bold">{form.values.email}</span>. The code
                expires in 5 minutes, so please enter it soon.
              </p>

              <Forms.Form form={form}>
                <div className="flex flex-col items-center">
                  <CodeInput field={"code"} />
                  <VerifyButton onClick={form.actions.submit} />
                </div>

                <div className="mt-8 text-center text-sm">Can’t find your code? Check your spam folder.</div>
              </Forms.Form>
            </div>
          </div>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function CodeInput({ field }: { field: string }) {
  const [value, setValue] = useFieldValue(field);

  return (
    <input
      name="code"
      autoFocus
      data-test-id="code"
      className={
        "text-4xl border border-surface-outline rounded-lg px-3 py-1.5 text-center placeholder-content-subtle w-60 bg-surface-base text-content-base"
      }
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  );
}

function VerifyButton({ onClick }: { onClick: () => void }) {
  const className = classNames(
    "w-60 flex justify-center py-2 px-4 mt-4",
    "border border-transparent",
    "rounded-md shadow-sm font-medium text-white-1",
    "bg-blue-600 hover:bg-blue-700",
  );

  return (
    <button className={className} onClick={onClick} type="button" data-test-id="submit">
      Continue -&gt;
    </button>
  );
}

interface FormValidation {
  email: boolean;
  name: boolean;
  password: boolean;
  confirmPassword: boolean;
  isValid: boolean;
}

function validateForm(form: any): FormValidation {
  const email = form.values.email.trim() !== "" && form.values.email.match(/.+@.+\..+/);
  const name = form.values.name.trim() !== "";
  const password = validatePassword(form.values.password).isValid;
  const confirmPassword = password && form.values.password === form.values.confirmPassword;

  const isValid = email && name && password && confirmPassword;

  return { email, name, password, confirmPassword, isValid };
}
