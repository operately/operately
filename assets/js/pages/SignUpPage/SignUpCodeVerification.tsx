import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

import Forms from "@/components/Forms";
import { OperatelyLogo } from "@/components/OperatelyLogo";

import classNames from "classnames";
import { useFieldValue } from "@/components/Forms/FormContext";
import { PageState } from "./index";

export function SignUpCodeVerification({ email, setState }: { email: string; setState: (state: PageState) => void }) {
  const form = Forms.useForm({
    fields: {
      code: "",
    },
    submit: async () => {
      setState({ state: "enter-details", email: email, code: form.values.code });
    },
  });

  return (
    <Pages.Page title={["Sign Up"]} testId="sign-up-page">
      <Paper.Root size="tiny">
        <Paper.Body className="h-dvh sm:h-auto">
          <div className="py-8 sm:px-4 sm:py-4">
            <div className="flex flex-col items-center text-center">
              <OperatelyLogo width="32px" height="32px" />
              <h1 className="text-3xl font-bold mt-4 mb-4">Check your email for a code</h1>
              <p className="text-content-dimmed mb-8">
                We've sent you a 6-character code to <span className="font-bold">{email}</span>. The code expires
                shortly, so please enter it soon.
              </p>

              <Forms.Form form={form}>
                <div className="flex flex-col items-center">
                  <CodeInput field={"code"} />
                  <VerifyButton onClick={form.actions.submit} />
                </div>

                <div className="mt-8 text-center text-sm font-medium">
                  Can’t find your code? Check your spam folder!
                </div>
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
