import React, { useCallback, useState } from "react";

import { PrimaryButton } from "../Button";
import { Checkbox } from "../Checkbox";
import { IconFlag, IconSparkles } from "../icons";
import { WizardHeading, WizardModal, WizardStep } from "./WizardLayout";

export namespace CompanyCreatorOnboardingWizard {
  export interface OnCompleteData {
    spaces: string[];
  }

  export interface Props {
    __initialStep?: Step;

    invitationLink: string;
    profileImageUrl: string;

    onComplete: (data: OnCompleteData) => void;
    onDismiss: () => void;
  }

  export type Step = "welcome" | "spaces" | "invite" | "project";
}

const STEP_SEQUENCE: CompanyCreatorOnboardingWizard.Step[] = ["welcome", "spaces", "invite", "project"];

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

interface WizardState {
  step: CompanyCreatorOnboardingWizard.Step;
  next: () => void;
  selectedSpaces: string[];
  toggleSpace: (space: string, nextChecked: boolean) => void;
  invitationLink: string;
  profileImageUrl: string;
}

function useOnboardingWizardState(props: CompanyCreatorOnboardingWizard.Props): WizardState {
  const [step, setStep] = useState<CompanyCreatorOnboardingWizard.Step>(props.__initialStep || "welcome");
  const [selectedSpaces, setSelectedSpaces] = useState<string[]>([]);

  const next = useCallback(() => {
    setStep((prev) => {
      const currentIndex = STEP_SEQUENCE.indexOf(prev);

      if (currentIndex >= 0 && currentIndex < STEP_SEQUENCE.length - 1) {
        return STEP_SEQUENCE[currentIndex + 1]!;
      }

      return prev;
    });
  }, []);

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
    step,
    next,
    selectedSpaces,
    toggleSpace,
    invitationLink: props.invitationLink,
    profileImageUrl: props.profileImageUrl,
  };
}

export function CompanyCreatorOnboardingWizard(props: CompanyCreatorOnboardingWizard.Props) {
  const state = useOnboardingWizardState(props);

  return (
    <WizardModal labelledBy="company-creator-onboarding-heading" onDismiss={props.onDismiss}>
      {state.step === "welcome" && <WelcomeStep state={state} />}
      {state.step === "spaces" && <SpacesStep state={state} />}
      {state.step === "invite" && <InviteStep state={state} />}
      {state.step === "project" && <ProjectStep state={state} onComplete={props.onComplete} />}
    </WizardModal>
  );
}

function WelcomeStep({ state }: { state: WizardState }) {
  return (
    <WizardStep
      footer={<PrimaryButton onClick={state.next}>Let's get started</PrimaryButton>}
    >
      <div className="p-6 pt-10 flex flex-col items-center text-center mx-auto">
        <img
          src={state.profileImageUrl}
          alt={"Marko Anastasov profile photo"}
          className="w-[120px] h-[120px] rounded-full object-cover shadow-lg"
        />
        <div className="mt-6 max-w-lg text-left text-content-base space-y-4 text-center">
          <h1 className="font-semibold text-2xl" id="company-creator-onboarding-heading">
            Thanks for joining Operately!
          </h1>
          <p>
            I'm thrilled to have you here. We built Operately to help teams work better together — to stay aligned, make
            progress visible, and keep everyone moving in the same direction.
          </p>
          <p>
            We'll walk you through a quick setup to get your workspace ready. It takes a few minutes, and you can always
            come back to this later.
          </p>
          <p className="italic">
            If you ever need help, reach out at support@operately.com. <br /> We're here for you.
          </p>
          <p>
            Best,
            <br />
            <span className="font-semibold">Marko Anastasov</span>
            <br />
            CEO & Founder, Operately
          </p>
        </div>
      </div>
    </WizardStep>
  );
}

function SpacesStep({ state }: { state: WizardState }) {
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
          totalSteps={3}
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

function InviteStep({ state }: { state: WizardState }) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied">("idle");
  const handleCopy = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(state.invitationLink);
      } else {
        const fallbackInput = document.createElement("input");
        fallbackInput.value = state.invitationLink;
        document.body.appendChild(fallbackInput);
        fallbackInput.select();
        document.execCommand("copy");
        document.body.removeChild(fallbackInput);
      }
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
          Next -&gt;
        </PrimaryButton>
      }
    >
      <div className="p-6">
        <WizardHeading
          stepNumber={2}
          totalSteps={3}
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
              value={state.invitationLink}
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

function ProjectStep({ state, onComplete }: { state: WizardState; onComplete: (data: CompanyCreatorOnboardingWizard.OnCompleteData) => void }) {
  const handleFinish = () => {
    onComplete({
      spaces: state.selectedSpaces,
    });
  };

  return (
    <WizardStep
      footer={
        <PrimaryButton onClick={handleFinish} size="sm">
          Finish setup
        </PrimaryButton>
      }
    >
      <div className="space-y-6 p-6">
        <WizardHeading
          stepNumber={3}
          totalSteps={3}
          title="Starter project"
          subtitle="We've created a starter project to help your team get moving with a clear, straightforward plan."
          id="company-creator-onboarding-heading"
        />
        <div className="relative overflow-hidden rounded-2xl border border-sky-300/70 bg-gradient-to-br from-sky-50 via-white to-slate-100 shadow-lg">
          <div className="pointer-events-none absolute -top-16 -left-10 h-40 w-40 rounded-full bg-sky-300/30 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 right-0 h-48 w-48 translate-x-1/4 translate-y-1/4 rounded-full bg-blue-200/40 blur-[90px]" />

          <div className="relative flex flex-col gap-6 p-6 sm:p-8">
            <span className="inline-flex items-center gap-2 self-start rounded-full bg-sky-600/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-700">
              <IconSparkles size={16} className="text-sky-500" />
              Guided kickoff
            </span>

            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-content-accent">Get Started with Operately</h2>
              <p className="text-sm text-content-dimmed">
                The starter project gives you a blueprint for aligning company strategy, goals, and execution from day
                one.
              </p>
            </div>

            <div className="space-y-3 text-sm text-content-base">
              <p className="text-xs font-semibold uppercase tracking-wide text-sky-700/80">Milestones we'll drive</p>
              <MilestoneItem>Onboard your team and set clear roles and responsibilities</MilestoneItem>
              <MilestoneItem>Define and communicate your company's goals and strategy</MilestoneItem>
              <MilestoneItem>Plan initiatives and projects with accountable owners</MilestoneItem>
              <MilestoneItem>Set up a cadence for status, accountability, and decision-making</MilestoneItem>
            </div>

            <div className="flex items-start gap-3 border-t border-sky-200/80 bg-white/70 pt-3 text-sm text-sky-900">
              <p>
                We'll populate the project with best-practices, examples and templates to help you quickly roll-out to
                your team.
              </p>
            </div>
          </div>
        </div>
      </div>
    </WizardStep>
  );
}

function MilestoneItem({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 leading-snug">
      <span className="mt-0.5 text-sky-600">
        <IconFlag size={18} className="text-sky-500" strokeWidth={2} />
      </span>
      <span>{children}</span>
    </div>
  );
}
