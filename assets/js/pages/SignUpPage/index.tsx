import * as React from "react";
import * as Pages from "@/components/Pages";

import { SignUpForm } from "./SignUpForm";
import { SignUpCodeVerification } from "./SignUpCodeVerification";
import { SignUpDetails } from "./SignUpDetails";

import { match } from "ts-pattern";

export const loader = Pages.emptyLoader;

export type PageState =
  | { state: "form" }
  | { state: "code-verification"; email: string }
  | { state: "enter-details"; email: string; code: string };

export function Page() {
  const [state, setState] = React.useState<PageState>({ state: "form" });

  return match(state)
    .with({ state: "form" }, () => <SignUpForm setState={setState} />)
    .with({ state: "code-verification" }, ({ email }) => <SignUpCodeVerification email={email} setState={setState} />)
    .with({ state: "enter-details" }, ({ email, code }) => <SignUpDetails email={email} code={code} />)
    .exhaustive();
}
