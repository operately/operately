import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Api from "@/api";

import Forms from "@/components/Forms";
import { OperatelyLogo } from "@/components/OperatelyLogo";

import classNames from "classnames";
import { Link } from "@/components/Link";
import { PageState } from "./index";

export function SignUpForm({ setState }: { setState: (state: PageState) => void }) {
  const form = Forms.useForm({
    fields: {
      email: "",
    },
    submit: async () => {
      await Api.createEmailActivationCode({ email: form.values.email });

      setState({ state: "code-verification", email: form.values.email });
    },
  });

  return (
    <Pages.Page title={["Sign Up"]} testId="sign-up-page">
      <Paper.Root size="tiny">
        <Paper.Body className="h-dvh sm:h-auto">
          <div className="py-8 sm:px-4 sm:py-4">
            <OperatelyLogo width="40px" height="40px" />
            <h1 className="text-2xl font-bold mt-4">Sign up for Operately</h1>
            <p className="text-content-dimmed mb-8">Use your work email &mdash; keep work and life separate.</p>

            <Forms.Form form={form}>
              <Forms.FieldGroup>
                <Forms.TextInput field={"email"} label="Work Email" placeholder="Enter your email address" required />
              </Forms.FieldGroup>

              <div className="mt-6">
                <SubmitButton onClick={form.actions.submit} />

                {window.appConfig.allowLoginWithGoogle && (
                  <>
                    <OrSeparator />
                    <SignUpWithGoogleButton />
                  </>
                )}
              </div>

              <div className="mt-8 text-center text-sm font-medium">
                Already have an account? <Link to="/log_in">Sign in</Link>
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
      Continue -&gt;
    </button>
  );
}

function OrSeparator() {
  return (
    <div className="flex items-center gap-4 my-6 text-content-dimmed uppercase text-xs font-medium tracking-wide">
      <div className="border-t border-stroke-base flex-1" />
      or
      <div className="border-t border-stroke-base flex-1" />
    </div>
  );
}

function SignUpWithGoogleButton() {
  return (
    <div data-test-id="google-sign-in">
      <a
        href="/accounts/auth/google"
        className="w-full inline-flex justify-center gap-2 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white-1 rounded-md shadow-sm font-medium"
      >
        <GoogleLogo />
        Sign up with Google
      </a>
    </div>
  );
}

function GoogleLogo() {
  return (
    <svg
      className="w-5 h-5 mt-0.5"
      aria-hidden="true"
      focusable="false"
      data-prefix="fab"
      data-icon="google"
      role="img"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 488 512"
    >
      <path
        fill="currentColor"
        d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
      ></path>
    </svg>
  );
}
