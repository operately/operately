import React from "react";
import { useTranslation } from "react-i18next";
import type { AccountChangeEmailPage } from "./index";
import { VerificationStep, VerificationStepProps } from "./VerificationStep";

type Props = VerificationStepProps & Pick<AccountChangeEmailPage.Props, "onConfirm">;

export function VerifyNewEmailStep(props: Props) {
  const { t } = useTranslation();

  return (
    <VerificationStep
      {...props}
      heading={t("Check your new inbox")}
      testId="email-change-new-inbox"
      saveText={t("Confirm email change")}
      instructions={t("Your current email stays active until you confirm this code.")}
      onVerify={props.onConfirm}
    />
  );
}
