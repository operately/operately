import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Icons from "@tabler/icons-react";

import { OperatelyLogo } from "@/components/OperatelyLogo";
import { DivLink, Link } from "@/components/Link";

export const loader = Pages.emptyLoader;

export function Page() {
  return (
    <Pages.Page title={["Sign Up"]} testId="sign-up-page">
      <Paper.Root size="tiny">
        <Paper.Body className="h-dvh sm:h-auto">
          <div className="py-8 sm:px-4 sm:py-4">
            <Header />

            <div className="flex flex-col gap-3 mb-8">
              <SignUpWithGoogleButton />
              <SignUpWithEmail />
            </div>

            <TosAndPrivacyPolicy />
            <SignInLink />
          </div>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Header() {
  return (
    <div className="mb-8">
      <OperatelyLogo width="40px" height="40px" />
      <h1 className="text-2xl font-bold mt-4">Sign up for Operately</h1>
      <div className="mt-2">Get started in a minute. No credit card required.</div>
    </div>
  );
}

function SignInLink() {
  return (
    <div className="text-center font-medium mt-8 pt-8 border-t border-stroke-base text-sm">
      Already have an account? <Link to="/log_in">Sign in</Link>
    </div>
  );
}

function TosAndPrivacyPolicy() {
  const tos = (
    <Link to="https://operately.com/legal/terms" underline="hover" target="_blank">
      Terms of Service{" "}
    </Link>
  );
  const pp = (
    <Link to="https://operately.com/legal/privacy-policy" underline="hover" target="_blank">
      Privacy Policy
    </Link>
  );

  return (
    <div className="text-center font-medium text-sm">
      By continuing, you agree to the {tos}
      and {pp}.
    </div>
  );
}

function SignUpWithEmail() {
  return (
    <DivLink
      to="/sign_up/email"
      className="w-full inline-flex gap-3 py-3 px-4 bg-surface-base rounded-md shadow hover:bg-surface-dimmed font-medium border border-surface-outline"
      data-test-id="sign-up-with-email"
    >
      <Icons.IconMail size={24} className="text-content-dimmed" />
      <div className="text-center w-10/12 font-medium">Sign up with email</div>
    </DivLink>
  );
}

function SignUpWithGoogleButton() {
  return (
    <a
      href="/accounts/auth/google"
      className="w-full inline-flex gap-3 py-3 px-4 bg-surface-base rounded-md shadow hover:bg-surface-dimmed font-medium border border-surface-outline"
      data-test-id="google-sign-in"
    >
      <GoogleLogo />
      <div className="text-center w-10/12 font-medium">Sign up with Google</div>
    </a>
  );
}

function GoogleLogo() {
  return (
    <svg
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      style={{ display: "block" }}
      className="w-5 h-5 mt-0.5"
    >
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      ></path>
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      ></path>
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      ></path>
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      ></path>
      <path fill="none" d="M0 0h48v48H0z"></path>
    </svg>
  );
}
