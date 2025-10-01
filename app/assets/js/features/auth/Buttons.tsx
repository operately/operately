import * as React from "react";
import { IconMail } from "turboui";

import { GoogleLogo } from "@/components/Brands";
import classNames from "classnames";
import { DivLink } from "turboui";

export function SignUpWithEmail({ inviteToken }: { inviteToken?: string | null }) {
  return (
    <SignUpButton
      title="Sign up with email"
      link={signupEmailPath(inviteToken)}
      icon={<IconMail size={24} className="text-content-dimmed" />}
      testId="sign-up-with-email"
    />
  );
}

export function SignInWithGoogleButton() {
  return (
    <SignUpButton
      title="Sign in with Google"
      link={getGoogleAuthUrl()}
      icon={<GoogleLogo />}
      external
      testId="sign-in-with-google"
    />
  );
}

export function SignUpWithGoogleButton() {
  return (
    <SignUpButton
      title="Sign up with Google"
      link={getGoogleAuthUrl()}
      icon={<GoogleLogo />}
      external
      testId="sign-up-with-google"
    />
  );
}

function signupEmailPath(inviteToken?: string | null): string {
  if (inviteToken) {
    return `/sign_up/email?invite_token=${inviteToken}`;
  } else {
    return "/sign_up/email";
  }
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
    "w-full inline-flex gap-3 py-2.5 px-4",
    "bg-surface-base rounded-md shadow font-semibold",
    "hover:bg-surface-dimmed border border-surface-outline",
  );

  return (
    <DivLink to={link} className={className} data-test-id={testId} external={external}>
      {icon}
      <div className="text-center w-10/12">{title}</div>
    </DivLink>
  );
}

function getGoogleAuthUrl(): string {
  const params = new URLSearchParams(window.location.search);
  const redirectTo = params.get("redirect_to");
  const inviteToken = params.get("invite_token");

  const search = new URLSearchParams();

  if (redirectTo) {
    search.set("redirect_to", redirectTo);
  }

  if (inviteToken) {
    search.set("invite_token", inviteToken);
  }

  const query = search.toString();

  if (query) {
    return `/accounts/auth/google?${query}`;
  }

  return "/accounts/auth/google";
}
