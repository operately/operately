import React from "react";
import type { AccountChangeEmailPage } from "./index";
import { VerificationStep, VerificationStepProps } from "./VerificationStep";

type Props = VerificationStepProps & Pick<AccountChangeEmailPage.Props, "onVerifyCurrent">;

export function VerifyCurrentEmailStep(props: Props) {
  return (
    <VerificationStep
      {...props}
      heading="Check your current inbox"
      testId="email-change-current-inbox"
      saveText="Verify current email"
      instructions={
        <>
          Verify this inbox first. Then we’ll send a separate code to{" "}
          <strong className="break-all">{props.pending.email}</strong>.
        </>
      }
      onVerify={props.onVerifyCurrent}
    />
  );
}
