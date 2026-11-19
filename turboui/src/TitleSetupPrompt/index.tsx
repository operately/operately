import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { SecondaryButton } from "../Button";
import { ErrorCallout } from "../Callouts";
import * as Forms from "../Forms";
import { translationText } from "../i18n";
import { WizardHeading, WizardModal, WizardStep } from "../OnboardingWizard/WizardLayout";

export namespace TitleSetupPrompt {
  export interface Props {
    onSave: (title: string) => Promise<void>;
    onSkip: () => Promise<void>;
  }
}

export function TitleSetupPrompt({ onSave, onSkip }: TitleSetupPrompt.Props) {
  const { t } = useTranslation();
  const isSubmittingRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasError, setHasError] = useState(false);

  async function complete(action: () => Promise<void>) {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setHasError(false);

    try {
      await action();
    } catch {
      setHasError(true);
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  const form = Forms.useForm({
    fields: { onboardingTitle: "" },
    submit: async () => {
      const title = form.values.onboardingTitle.trim();
      if (title) await complete(() => onSave(title));
    },
  });

  return (
    <WizardModal labelledBy="title-setup-heading" testId="title-setup-prompt">
      <Forms.Form form={form}>
        <WizardStep
          footer={
            <>
              <SecondaryButton
                type="button"
                testId="skip-title"
                disabled={isSubmitting}
                onClick={() => complete(onSkip)}
              >
                {t("Skip for now")}
              </SecondaryButton>
              <Forms.Submit
                testId="save-title"
                saveText={translationText(t("Save"))}
                buttonSize="base"
                containerClassName="w-full sm:w-auto [&>button]:w-full"
                disabled={isSubmitting || !form.values.onboardingTitle.trim()}
                submitOnEnter
              />
            </>
          }
        >
          <div className="space-y-6">
            <WizardHeading
              stepNumber={1}
              totalSteps={1}
              title={translationText(t("What's your title?"))}
              subtitle={translationText(t("Let teammates know what you focus on. You can change this later."))}
              id="title-setup-heading"
            />
            <Forms.FieldGroup>
              <Forms.TextInput
                field="onboardingTitle"
                label={translationText(t("Title in Company"))}
                placeholder={translationText(t("e.g Product Manager, Designer, CEO"))}
                autoFocus
              />
            </Forms.FieldGroup>
            {hasError && (
              <div role="alert">
                <ErrorCallout message={t("Something went wrong. Please try again.")} />
              </div>
            )}
          </div>
        </WizardStep>
      </Forms.Form>
    </WizardModal>
  );
}
