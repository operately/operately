import * as React from "react";
import * as Pages from "@/components/Pages";

import { SignUpForm } from "./SignUpForm";
import { SignUpCodeVerification } from "./SignUpCodeVerification";
import { SignUpDetails } from "./SignUpDetails";

import { match } from "ts-pattern";

export const loader = Pages.emptyLoader;

export type PageState = "form" | "code-verification" | "enter-details";

export function Page() {
  const [state, setState] = React.useState<PageState>("form");

  // The user enters this on the first page
  const [email, setEmail] = React.useState<string | null>(null);

  // The user enters this on the second page
  const [code, setCode] = React.useState<string | null>(null);

  return match(state)
    .with("form", () => <SignUpForm setState={setState} setEmail={setEmail} />)
    .with("code-verification", () => <SignUpCodeVerification setCode={setCode} email={email!} setState={setState} />)
    .with("enter-details", () => <SignUpDetails email={email!} code={code!} />)
    .exhaustive();
}
