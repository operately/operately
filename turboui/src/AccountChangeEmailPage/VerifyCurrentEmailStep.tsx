import React from "react";
import { Trans, useTranslation } from "react-i18next";
import type { AccountChangeEmailPage } from "./index";
import { VerificationStep, VerificationStepProps } from "./VerificationStep";

type Props = VerificationStepProps & Pick<AccountChangeEmailPage.Props, "onVerifyCurrent">;

export function VerifyCurrentEmailStep(props: Props) {
  const { t } = useTranslation();

  return (
    <VerificationStep
      {...props}
      heading={t("Check your current inbox")}
      testId="email-change-current-inbox"
      saveText={t("Verify current email")}
      instructions={
        <Trans
          i18nKey="Verify this inbox first. Then we’ll send a separate code to <email>{{email}}</email>."
          values={{ email: props.pending.email }}
          components={{ email: <strong className="break-all" /> }}
        />
      }
      onVerify={props.onVerifyCurrent}
    />
  );
}
