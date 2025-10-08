import React, { useCallback, useState } from "react";

import { match } from "ts-pattern";
import { PrimaryButton } from "../Button";
import { Checkbox } from "../Checkbox";
import { WelcomeStep } from "./WelcomeStep";
import { useWizardState, WizardState } from "./WizadState";
import { WizardHeading, WizardModal, WizardStep } from "./WizardLayout";

export namespace CompanyCreatorOnboardingWizard {
  export interface OnCompleteData {
    spaces: string[];
  }

  export interface Props {
    __initialStep?: Step;

    invitationLink: string;
    markoImageUrl: string;

    onComplete: (data: OnCompleteData) => void;
    onDismiss: () => void;
  }

  export type Step = "welcome" | "spaces" | "invite";
}

type Step = CompanyCreatorOnboardingWizard.Step;

const STEPS: Step[] = ["welcome", "spaces", "invite"];

const SPACE_OPTIONS = [
  "Marketing",
  "Sales",
  "Engineering",
  "Product",
  "Design",
  "HR",
  "Finance",
  "Customer Success",
  "Operations",
  "Legal",
];

interface State extends WizardState<Step> {
  // Which spaces are selected
  selectedSpaces: string[];
  toggleSpace: (space: string, nextChecked: boolean) => void;
}

function useOnboardingState(props: CompanyCreatorOnboardingWizard.Props): State {
  const initialState = props.__initialStep || "welcome";
  const wizardState = useWizardState<Step>(initialState, STEPS, props.onDismiss);
  const [selectedSpaces, setSelectedSpaces] = useState<string[]>([]);

  const toggleSpace = useCallback((space: string, nextChecked: boolean) => {
    setSelectedSpaces((prev) => {
      if (nextChecked) {
        if (prev.includes(space)) return prev;
        if (prev.length >= 10) return prev;
        return [...prev, space];
      } else {
        return prev.filter((s) => s !== space);
      }
    });
  }, []);

  return {
    ...wizardState,

    selectedSpaces,
    toggleSpace,
  };
}

export function CompanyCreatorOnboardingWizard(props: CompanyCreatorOnboardingWizard.Props) {
  const state = useOnboardingState(props);

  return (
    <WizardModal labelledBy="company-creator-onboarding-heading" onDismiss={props.onDismiss}>
      {match(state.currentStep)
        .with("welcome", () => <WelcomeStep state={state} imageUrl={props.markoImageUrl} whatReady="workspace" />)
        .with("spaces", () => <SpacesStep state={state} />)
        .with("invite", () => <InviteStep state={state} invitationLink={props.invitationLink} />)
        .run()}
    </WizardModal>
  );
}

function SpacesStep({ state }: { state: State }) {
  return (
    <WizardStep
      footer={
        <PrimaryButton onClick={state.next} size="sm">
          Next -&gt;
        </PrimaryButton>
      }
    >
      <div className="p-6">
        <WizardHeading
          stepNumber={1}
          totalSteps={2}
          title="Set up spaces"
          subtitle={
            <>
              Spaces help you organize work by team or department.
              <br />
              Do you have any of these teams in your company?
            </>
          }
          id="company-creator-onboarding-heading"
        />

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2" role="list">
          {SPACE_OPTIONS.map((space) => {
            const checked = state.selectedSpaces.includes(space);
            const handleToggle = (nextChecked: boolean) => state.toggleSpace(space, nextChecked);

            return (
              <div
                key={space}
                role="checkbox"
                aria-checked={checked}
                onClick={() => handleToggle(!checked)}
                className="flex items-center gap-3"
              >
                <Checkbox checked={checked} onChange={handleToggle} />
                <span>{space}</span>
              </div>
            );
          })}
        </div>

        <div className="mt-8 text-xs text-content-dimmed">You can always edit spaces later or add new ones.</div>
      </div>
    </WizardStep>
  );
}

function InviteStep({ state, invitationLink }: { state: State; invitationLink: string }) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied">("idle");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(invitationLink);

      setCopyStatus("copied");
      setTimeout(() => setCopyStatus("idle"), 2000);
    } catch {
      setCopyStatus("idle");
    }
  };

  return (
    <WizardStep
      footer={
        <PrimaryButton onClick={state.next} size="sm">
          Finish Setup
        </PrimaryButton>
      }
    >
      <div className="p-6">
        <WizardHeading
          stepNumber={2}
          totalSteps={2}
          title="Invite your team"
          subtitle="Share this link to get your team on board with Operately."
          id="company-creator-onboarding-heading"
        />

        <div className="space-y-1 mt-6">
          <label className="text-sm font-bold text-content-accent" htmlFor="onboarding-invite-link">
            Your invitation link
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              id="onboarding-invite-link"
              value={invitationLink}
              readOnly
              className="flex-1 min-w-0 px-3 py-2 border border-surface-outline bg-surface-dimmed rounded-lg bg-surface-base text-sm text-content-accent focus:outline-none focus:ring-2 focus:ring-brand-1"
              aria-label="Invitation link"
            />

            <PrimaryButton onClick={handleCopy}>{copyStatus === "copied" ? "Copied" : "Copy link"}</PrimaryButton>
          </div>
        </div>

        <div className="mt-8 text-xs text-content-dimmed">
          You can always find this link later in Home -&gt; Invite People
        </div>
      </div>
    </WizardStep>
  );
}
