import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

export const loader = Pages.emptyLoader;

export function Page() {
  // const [state, setState] = React.useState<PageState>({ state: "form" });

  // return match(state)
  //   .with({ state: "form" }, () => <SignUpForm setState={setState} />)
  //   .with({ state: "code-verification" }, ({ email }) => <SignUpCodeVerification email={email} setState={setState} />)
  //   .with({ state: "enter-details" }, ({ email, code }) => <SignUpDetails email={email} code={code} />)
  //   .exhaustive();
  //

  return <></>;
}
