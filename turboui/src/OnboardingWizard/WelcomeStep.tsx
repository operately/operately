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
          className="w-[120px] h-[120px] rounded-full object-cover shadow-lg"
        />
        <div className="mt-6 max-w-lg text-content-base space-y-4">
          <h1 className="font-semibold text-2xl" id={resolvedHeadingId}>
            Thanks for joining Operately!
          </h1>
          <p>
            I'm thrilled to have you here. We built Operately to help teams work better together — to stay aligned, make
            progress visible, and keep everyone moving in the same direction.
          </p>
          <p>
            We'll walk you through a quick setup to get your {whatReady} ready. It takes just a few minutes, and you can
            always come back to this later.
          </p>
          <p className="italic">
            If you ever need help, reach out at marko@operately.com.
            <br /> We're here for you.
          </p>
          <p>
            Best regards,
            <br />
            <span className="font-semibold">Marko Anastasov</span>
            <br />
            CEO &amp; Founder, Operately
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
