import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Api from "@/api";

import Forms from "@/components/Forms";
import { OperatelyLogo } from "@/components/OperatelyLogo";

import classNames from "classnames";
import { logIn } from "@/routes/auth";

export function SignUpDetails({ email, code }: { email: string; code: string }) {
  code = code.replace(/-/g, "");

  const form = Forms.useForm({
    fields: {
      name: "",
      password: "",
      confirmPassword: "",
    },
    validate: (addError) => {
      if (form.values.password !== form.values.confirmPassword) {
        addError("confirmPassword", "Passwords do not match");
      }
    },
    submit: async () => {
      await Api.createAccount({
        code,
        email,
        fullName: form.values.name,
        password: form.values.password,
      });

      logIn(email, form.values.password, { redirectTo: "/" });
    },
  });

  return (
    <Pages.Page title={["Sign Up"]} testId="sign-up-page">
      <Paper.Root size="tiny">
        <Paper.Body className="h-dvh sm:h-auto">
          <div className="py-8 sm:px-4 sm:py-4">
            <OperatelyLogo width="40px" height="40px" />
            <h1 className="text-2xl font-bold mt-4">Create your Operately account</h1>
            <p className="text-content-dimmed mb-8">Enter your full name and create a password.</p>

            <Forms.Form form={form}>
              <Forms.FieldGroup>
                <Forms.TextInput field={"name"} label="Full Name" placeholder="Enter your full name" required />
                <Forms.PasswordInput
                  field={"password"}
                  label="Password"
                  minLength={12}
                  placeholder="At least 12 characters"
                  required
                />
                <Forms.PasswordInput
                  field={"confirmPassword"}
                  label="Confirm Password"
                  minLength={12}
                  placeholder="At least 12 characters"
                  required
                />
              </Forms.FieldGroup>

              <div className="mt-6">
                <SubmitButton onClick={form.actions.submit} />
              </div>
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
  );

  return (
    <button className={className} onClick={onClick} type="button" data-test-id="submit">
      Create Account
    </button>
  );
}
