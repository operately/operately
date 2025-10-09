import React, { useCallback, useMemo, useState } from "react";

import { match } from "ts-pattern";
import { PrimaryButton, SecondaryButton } from "../Button";
import { Checkbox } from "../Checkbox";
import { WelcomeStep } from "./WelcomeStep";
import { useWizardState, WizardState } from "./WizadState";
import { WizardHeading, WizardModal, WizardStep } from "./WizardLayout";

export namespace CompanyCreatorOnboardingWizard {
  export interface SpaceOption {
    name: string;
    description: string;
  }

  export interface OnCompleteData {
    spaces: SpaceOption[];
  }

  export interface Props {
    __initialStep?: Step;

    invitationLink: string | null;
    markoImageUrl: string;
    isCompleting?: boolean;

    onComplete: (data: OnCompleteData) => void;
    onDismiss: () => void;
  }

  export type Step = "welcome" | "spaces" | "invite";
}

type Step = CompanyCreatorOnboardingWizard.Step;

const STEPS: Step[] = ["welcome", "spaces", "invite"];

const SPACE_OPTIONS: CompanyCreatorOnboardingWizard.SpaceOption[] = [
  { name: "Marketing", description: "All go-to-market work." },
  { name: "Sales", description: "Sales and revenue operations." },
  { name: "Engineering", description: "Product development and engineering." },
  { name: "Product", description: "Product management and strategy." },
  { name: "Design", description: "Brand and product design." },
  { name: "HR", description: "People operations and HR." },
  { name: "Finance", description: "Finance, budgeting, and accounting." },
  { name: "Customer Success", description: "Customer onboarding and support." },
  { name: "Operations", description: "Business operations and processes." },
  { name: "Legal", description: "Legal, contracts, and compliance." },
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
  const handleComplete = useCallback(() => {
    props.onComplete({ spaces: state.selectedSpaces });
  }, [props.onComplete, state.selectedSpaces]);

  return (
    <WizardModal
      labelledBy="company-creator-onboarding-heading"
      onDismiss={props.onDismiss}
      testId="company-creator-onboarding"
    >
      {match(state.currentStep)
        .with("welcome", () => (
          <WelcomeStep
            state={state}
            imageUrl={props.markoImageUrl}
            whatReady="workspace"
            headingId="company-creator-onboarding-heading"
            stepTestId="company-creator-step-welcome"
            startTestId="company-creator-lets-start"
          />
        ))
        .with("spaces", () => <SpacesStep state={state} />)
        .with("invite", () => (
          <InviteStep
            state={state}
            invitationLink={props.invitationLink}
            isCompleting={props.isCompleting}
            onComplete={handleComplete}
          />
        ))
        .run()}
    </WizardModal>
  );
}

function SpacesStep({ state }: { state: State }) {
  const selections = useMemo(() => new Set(state.selectedSpaces), [state.selectedSpaces]);

  return (
    <WizardStep
      testId="company-creator-step-spaces"
      footer={
        <PrimaryButton onClick={state.next} size="sm" testId="company-creator-next">
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
            const checked = selections.has(space.name);
            const handleToggle = (nextChecked: boolean) => state.toggleSpace(space.name, nextChecked);

            return (
              <div
                key={space.name}
                role="checkbox"
                aria-checked={checked}
                onClick={() => handleToggle(!checked)}
                className="flex items-center gap-3 cursor-pointer rounded-lg px-2 py-1 hover:bg-surface-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-1"
                data-test-id={`company-creator-space-${toTestId(space.name)}`}
              >
                <Checkbox checked={checked} onChange={handleToggle} />
                <span>{space.name}</span>
              </div>
            );
          })}
        </div>

        <div className="mt-8 text-xs text-content-dimmed">You can always edit spaces later or add new ones.</div>
      </div>
    </WizardStep>
  );
}

function InviteStep({
  state,
  invitationLink,
  onComplete,
  isCompleting,
}: {
  state: State;
  invitationLink: string | null;
  onComplete: () => void;
  isCompleting?: boolean;
}) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied">("idle");
  const linkReady = Boolean(invitationLink);

  const handleCopy = async () => {
    if (!invitationLink) return;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(invitationLink);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = invitationLink;
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }

      setCopyStatus("copied");
      setTimeout(() => setCopyStatus("idle"), 2000);
    } catch {
      setCopyStatus("idle");
    }
  };

  return (
    <WizardStep
      testId="company-creator-step-invite"
      footer={
        <>
          <SecondaryButton onClick={state.back} size="sm" testId="company-creator-back">
            Back
          </SecondaryButton>
          <PrimaryButton
            onClick={onComplete}
            size="sm"
            testId="company-creator-finish"
            disabled={isCompleting || !linkReady}
            loading={isCompleting}
          >
            Finish Setup
          </PrimaryButton>
        </>
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
              value={invitationLink ?? ""}
              readOnly
              className="flex-1 min-w-0 px-3 py-2 border border-surface-outline bg-surface-dimmed rounded-lg bg-surface-base text-sm text-content-accent focus:outline-none focus:ring-2 focus:ring-brand-1"
              aria-label="Invitation link"
              placeholder={linkReady ? undefined : "Generating invite link..."}
              data-test-id="company-creator-invite-link"
            />

            <PrimaryButton onClick={handleCopy} disabled={!linkReady} testId="company-creator-copy-link" size="sm">
              {copyStatus === "copied" ? "Copied" : "Copy link"}
            </PrimaryButton>
          </div>
        </div>

        <div className="mt-8 text-xs text-content-dimmed">
          You can always find this link later in Home -&gt; Invite People
        </div>
      </div>
    </WizardStep>
  );
}

function toTestId(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
