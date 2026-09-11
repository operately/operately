import React from "react";
import type { AccountChangeEmailPage } from "./index";
import { VerificationStep, VerificationStepProps } from "./VerificationStep";

type Props = VerificationStepProps & Pick<AccountChangeEmailPage.Props, "onConfirm">;

export function VerifyNewEmailStep(props: Props) {
  return (
    <VerificationStep
      {...props}
      heading="Check your new inbox"
      testId="email-change-new-inbox"
      saveText="Confirm email change"
      instructions={"Your current email stays active until you confirm this code."}
      onVerify={props.onConfirm}
    />
  );
}
