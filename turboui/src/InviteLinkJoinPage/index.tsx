import React from "react";

import { match } from "ts-pattern";
import { Avatar } from "../Avatar";
import { PrimaryButton, SecondaryButton } from "../Button";
import { IconMoodSad } from "../icons";
import { OperatelyLogo } from "../Logo";
import { useHtmlTitle } from "../Page/useHtmlTitle";

export namespace InviteLinkJoinPage {
  export type PageState = "logged-in-user-valid-token" | "anonymous-user-valid-token" | "invalid-token";

  export interface Invitation {
    company: {
      id: string;
      name: string;
    };
    author: {
      id: string;
      fullName: string;
      avatarUrl: string | null;
    };
  }

  export interface Props {
    pageState: PageState;
    invitation: Invitation | null;
    token: string | null;

    // For logged in users
    handleJoin: () => void;
    joining?: boolean;
    joinError?: string | null;

    // For anonymous users
    handleSignUpAndJoin: () => void;
    handleLogInAndJoin: () => void;
  }
}

export function InviteLinkJoinPage(props: InviteLinkJoinPage.Props) {
  useHtmlTitle("Join Company");

  return (
    <div className="">
      <div className="flex items-center justify-center gap-2 text-xl font-bold mb-6 mt-12">
        <OperatelyLogo width="30" height="30" /> Operately
      </div>

      {match(props.pageState)
        .with("logged-in-user-valid-token", () => <LoggedInUserValidTokenState {...props} />)
        .with("anonymous-user-valid-token", () => <AnonymousValidTokenState {...props} />)
        .with("invalid-token", () => <InvalidTokenState />)
        .exhaustive()}
    </div>
  );
}

function LoggedInUserValidTokenState(props: InviteLinkJoinPage.Props) {
  return (
    <div className="bg-surface-base mx-auto p-12 w-[500px] border border-stroke-base rounded-xl shadow-lg">
      <div className="text-center flex flex-col items-center mb-8">
        <Avatar person={props.invitation?.author!} size={64} className="mb-4" />
        {props.invitation?.author?.fullName} invited you to join
        <div className="text-xl font-semibold">{props.invitation?.company?.name}</div>
      </div>

      <div className="flex items-center flex-col items-stretch">
        <PrimaryButton
          onClick={props.handleJoin}
          testId="join-company"
          loading={props.joining}
          disabled={props.joining}
        >
          Join {props.invitation?.company?.name}
        </PrimaryButton>
        {props.joinError && <div className="text-sm text-red-500 mt-4 text-center">{props.joinError}</div>}
      </div>
    </div>
  );
}

function AnonymousValidTokenState(props: InviteLinkJoinPage.Props) {
  return (
    <div className="bg-surface-base mx-auto p-12 w-[500px] border border-stroke-base rounded-xl shadow-lg">
      <div className="text-center flex flex-col items-center mb-8">
        <Avatar person={props.invitation?.author!} size={64} className="mb-4" />
        {props.invitation?.author?.fullName} invited you to join
        <div className="text-xl font-semibold">{props.invitation?.company?.name}</div>
      </div>

      <div className="flex items-center flex-col items-stretch">
        <SecondaryButton onClick={props.handleSignUpAndJoin} testId="sign-up-and-join">
          Sign Up & Join {props.invitation?.company?.name}
        </SecondaryButton>

        <div className="flex items-center my-4 w-full gap-4">
          <div className="border-t border-surface-outline flex-grow" />
          <div className="text-content-dimmed text-sm">Or, if you've used Operately before</div>
          <div className="border-t border-surface-outline flex-grow" />
        </div>

        <SecondaryButton onClick={props.handleLogInAndJoin} testId="log-in-and-join">
          Log in with your account
        </SecondaryButton>
      </div>
    </div>
  );
}

function InvalidTokenState() {
  return (
    <div className="bg-surface-base mx-auto p-12 w-[500px] border border-stroke-base rounded-xl shadow-lg">
      <div className="bg-callout-warning-bg p-4 rounded-md">
        <div className="flex items-center text-center gap-2">
          <IconMoodSad size={24} className="text-callout-warning-content mb-2" />
          <div className="font-semibold mb-2">Invalid Link</div>
        </div>
        <div>
          Hmm, something's not right with this link. Double-check it or ask whoever sent it to you for a fresh one.
        </div>
      </div>
    </div>
  );
}
