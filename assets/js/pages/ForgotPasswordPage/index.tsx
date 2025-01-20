import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

import Forms from "@/components/Forms";
import classNames from "classnames";
import { OperatelyLogo } from "@/components/OperatelyLogo";

export const loader = Pages.emptyLoader;

export function Page() {
  const form = Forms.useForm({
    fields: {
      email: "",
    },
    submit: async () => {},
  });

  return (
    <Pages.Page title={["Forgot Password"]} testId="forgot-password-page">
      <Paper.Root size="tiny">
        <Paper.NavigateBack to="/log_in" title="Back to Sign In" />
        <Paper.Body className="h-dvh sm:h-auto">
          <div className="py-8 sm:px-4 sm:py-4">
            <OperatelyLogo width="30px" height="30px" />
            <h1 className="text-2xl font-bold mt-4">Forgot Password?</h1>
            <p className="text-content-dimmed mb-4">Get reset instructions via email.</p>

            <Forms.Form form={form}>
              <Forms.FieldGroup>
                <Forms.TextInput field="email" label="Email" placeholder="e.g. your@email.com" required />
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
      Send Reset Instructions
    </button>
  );
}
