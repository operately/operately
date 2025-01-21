import * as Api from "@/api";
import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

import Forms from "@/components/Forms";
import classNames from "classnames";
import { OperatelyLogo } from "@/components/OperatelyLogo";
import { useNavigate } from "react-router-dom";

import { validateEmailPassword } from "@/features/auth/validateEmailPassword";
import { PasswordStrength } from "@/features/auth/PasswordStrength";

export const loader = Pages.emptyLoader;

export function Page() {
  const [reset] = Api.useResetPassword();
  const token = new URLSearchParams(window.location.search).get("token")!;
  const navigate = useNavigate();

  const form = Forms.useForm({
    fields: {
      email: "",
      password: "",
      passwordConfirmation: "",
    },
    validate: (addError) => {
      if (form.values.password !== form.values.passwordConfirmation) {
        addError("confirmPassword", "Passwords do not match");
      }
    },
    submit: async () => {
      await reset({
        email: form.values.email,
        password: form.values.password,
        passwordConfirmation: form.values.passwordConfirmation,
        resetPasswordToken: token,
      });

      navigate("/log_in");
    },
  });

  const validation = validateEmailPassword(form);

  return (
    <Pages.Page title={["Reset Password"]} testId="reset-password-page">
      <Paper.Root size="tiny">
        <Paper.Body className="h-dvh sm:h-auto">
          <div className="py-8 sm:px-4 sm:py-4">
            <OperatelyLogo width="30px" height="30px" />
            <h1 className="text-2xl font-bold mt-4">Reset Password</h1>

            <Forms.Form form={form}>
              <Forms.FieldGroup>
                <Forms.TextInput field="email" label="Email" placeholder="e.g. your@email.com" required />
                <Forms.PasswordInput
                  field="password"
                  label="Password"
                  placeholder="Enter your new password"
                  required
                  okSign={validation.password}
                />

                <Forms.PasswordInput
                  field="password_confirmation"
                  label="Confirm Password"
                  placeholder="Re-enter your new password"
                  required
                  okSign={validation.email}
                />

                <PasswordStrength password={form.values.password} />
              </Forms.FieldGroup>

              <SubmitButton onClick={form.actions.submit} />
            </Forms.Form>
          </div>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function SubmitButton({ onClick }: { onClick: () => void }) {
  const className = classNames(
    "w-full flex justify-center py-2 px-4",
    "border border-transparent",
    "rounded-md shadow-sm font-medium text-white-1",
    "bg-blue-600 hover:bg-blue-700",
    "mt-6",
  );

  return (
    <button type="submit" className={className} onClick={onClick} data-test-id="submit">
      Reset Password
    </button>
  );
}
