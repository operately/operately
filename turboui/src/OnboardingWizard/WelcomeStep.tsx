import React from "react";

import { PrimaryButton } from "../Button";
import { WizardState } from "./WizadState";
import { WizardStep } from "./WizardLayout";

export interface WelcomeStepProps {
  state: WizardState<any>;
  imageUrl: string;
  whatReady: "profile" | "workspace";
  headingId?: string;
  stepTestId?: string;
  startTestId?: string;
}

export function WelcomeStep({ state, imageUrl, whatReady, headingId, stepTestId, startTestId }: WelcomeStepProps) {
  const resolvedHeadingId = headingId ?? defaultHeadingId(whatReady);

  return (
    <WizardStep
      testId={stepTestId}
      footer={
        <PrimaryButton onClick={state.next} testId={startTestId}>
          Let's get started
        </PrimaryButton>
      }
    >
      <div className="flex flex-col items-center text-center mx-auto pt-8 pb-4 px-4">
        <img
          src={imageUrl}
          alt={"Marko Anastasov, CEO & Founder, Operately"}
          className="w-[80px] h-[80px] sm:w-[120px] sm:h-[120px] rounded-full object-cover shadow-lg"
        />
        <div className="mt-6 max-w-lg text-content-base space-y-4 text-left">
          <h1 className="font-semibold text-xl" id={resolvedHeadingId}>
            Thanks for signing up!
          </h1>
          <p>
            Operately is what I wished I had when I started my first company. We had plenty of tools, but no single
            place where plans and daily work came together.
          </p>
          <p>If you ever need a hand or want to talk shop, email me at marko@operately.com and I'll reply.</p>
          <p>
            Onward,
            <br />
            Marko Anastasov
            <br />
            Co-founder &amp; CEO of Operately
          </p>
        </div>
      </div>
    </WizardStep>
  );
}

function defaultHeadingId(whatReady: WelcomeStepProps["whatReady"]) {
  if (whatReady === "workspace") {
    return "company-creator-onboarding-heading";
  }

  return "company-member-onboarding-heading";
}
