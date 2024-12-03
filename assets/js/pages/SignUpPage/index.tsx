import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Icons from "@tabler/icons-react";

import { OperatelyLogo } from "@/components/OperatelyLogo";
import { DivLink, Link } from "@/components/Link";
import classNames from "classnames";

import { GoogleLogo } from "@/features/SignUp/GoogleLogo";
import { TosAndPrivacyPolicy } from "@/features/SignUp/AgreeToTosAndPp";

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

function SignUpWithEmail() {
  return (
    <SignUpButton
      title="Sign up with email"
      link="/sign_up/email"
      icon={<Icons.IconMail size={24} className="text-content-dimmed" />}
      testId="sign-up-with-email"
    />
  );
}

function SignUpWithGoogleButton() {
  return (
    <SignUpButton
      title="Sign up with Google"
      link="/accounts/auth/google"
      icon={<GoogleLogo />}
      external
      testId="sign-up-with-google"
    />
  );
}

interface SignUpButtonProps {
  title: string;
  link: string;
  icon: React.ReactNode;
  external?: boolean;
  testId?: string;
}

function SignUpButton({ title, link, icon, external, testId }: SignUpButtonProps) {
  const className = classNames(
    "w-full inline-flex gap-3 py-3 px-4",
    "bg-surface-base rounded-md shadow",
    "hover:bg-surface-dimmed font-medium border border-surface-outline",
  );

  return (
    <DivLink to={link} className={className} data-test-id={testId} external={external}>
      {icon}
      <div className="text-center w-10/12 font-medium">{title}</div>
    </DivLink>
  );
}
