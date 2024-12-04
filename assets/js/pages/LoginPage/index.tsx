import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

import Forms from "@/components/Forms";
import { OperatelyLogo } from "@/components/OperatelyLogo";

import classNames from "classnames";
import { logIn } from "@/routes/auth";
import { Link } from "@/components/Link";
import { SignInWithGoogleButton } from "@/features/auth/Buttons";

export const loader = Pages.emptyLoader;

export function Page() {
  const [error, setError] = React.useState<string | null>(null);

  const form = Forms.useForm({
    fields: {
      email: "",
      password: "",
    },
    submit: async () => {
      const res = await logIn(form.values.email, form.values.password, {
        redirectTo: getRedirectTo(),
      });

      if (res === "failure") {
        setError("Invalid email or password");
      }
    },
  });

  return (
    <Pages.Page title={["Sign In"]} testId="login-page">
      <Paper.Root size="tiny">
        <Paper.Body className="h-dvh sm:h-auto">
          <div className="py-8 sm:px-4 sm:py-4">
            <OperatelyLogo width="40px" height="40px" />
            <h1 className="text-2xl font-bold mt-4">Operately</h1>
            <p className="text-content-dimmed mb-8">Please enter your details to sign in</p>

            <Forms.Form form={form}>
              {window.appConfig.allowLoginWithGoogle && <EmailLogin form={form} error={error} />}
              {window.appConfig.allowLoginWithGoogle && <GoogleLogin />}

              <div className="mt-8 text-center text-sm font-medium">
                Don't have an account? <Link to="/sign_up">Create an account</Link>
              </div>
            </Forms.Form>
          </div>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function EmailLogin({ form, error }: { form: any; error: string | null }) {
  return (
    <div>
      <Forms.FieldGroup>
        <Forms.TextInput field={"email"} label="Email" placeholder="your@email.com" required />
        <Forms.PasswordInput field={"password"} label="Password" placeholder="Password" required />
      </Forms.FieldGroup>

      {error && <div className="text-red-600 text-sm mt-2">{error}</div>}

      <div className="mt-8">
        <SubmitButton onClick={form.actions.submit} />
      </div>
    </div>
  );
}

function GoogleLogin() {
  return (
    <div>
      {window.appConfig.allowLoginWithEmail && <OrSeparator />}
      <SignInWithGoogleButton />
    </div>
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
      Sign in
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

function getRedirectTo(): string | null {
  const query = new URLSearchParams(window.location.search);
  const redirectTo = query.get("redirect_to");

  if (redirectTo) {
    const decoded = decodeURIComponent(redirectTo);

    return decoded.startsWith("/") ? decoded : null;
  } else {
    return null;
  }
}
