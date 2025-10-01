import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as React from "react";

import { OperatelyLogo } from "@/components/OperatelyLogo";
import { Link } from "turboui";

import { TosAndPrivacyPolicy } from "@/features/auth/AgreeToTosAndPp";
import { SignUpWithEmail, SignUpWithGoogleButton } from "@/features/auth/Buttons";
import { PageModule } from "@/routes/types";

export default { name: "SignUpPage", loader: Pages.emptyLoader, Page } as PageModule;

function Page() {
  const inviteToken = new URLSearchParams(window.location.search).get("invite_token");

  return (
    <Pages.Page title={["Sign Up"]} testId="sign-up-page">
      <Paper.Root size="tiny">
        <Paper.Body className="h-dvh sm:h-auto">
          <div className="py-8 sm:px-4 sm:py-4">
            <Header />

            <div className="flex flex-col gap-3 mb-8">
              {window.appConfig.allowSignupWithGoogle && <SignUpWithGoogleButton />}
              {window.appConfig.allowSignupWithEmail && <SignUpWithEmail inviteToken={inviteToken} />}
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
