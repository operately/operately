import React, { useCallback, useState } from "react";

import { PrimaryButton } from "../Button";
import { Checkbox } from "../Checkbox";
import { IconFlag, IconSparkles, IconTarget } from "../icons";

export namespace OnboardingWizard {
  /**
   * Data exposed when the user completes the wizard. The list of space
   * names entered by the user (deduplicated, trimmed, up to 10). If
   * the user skipped the step, this will be an empty array.
   */
  export interface OnCompleteData {
    spaces: string[];
  }

  export interface Props {
    // Defaults to "welcome", for testing purposes only.
    __initialStep?: "welcome" | "spaces" | "invite" | "project";

    invitationLink: string;

    onComplete: (data: OnCompleteData) => void;
    onDismiss: () => void;
  }
}

const PROFILE_IMAGE_URL = "https://pbs.twimg.com/profile_images/1631277097246179330/IpGRsar1_400x400.jpg";
const PROFILE_IMAGE_ALT = "Marko Anastasov profile photo";

const STEP_SEQUENCE: Step[] = ["welcome", "spaces", "invite", "project"];

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

type Step = "welcome" | "spaces" | "invite" | "project";

interface WizardState {
  step: Step;
  next: () => void;
  selectedSpaces: string[];
  toggleSpace: (space: string, nextChecked: boolean) => void;
  invitationLink: string;
}

function useOnboardingWizardState(props: OnboardingWizard.Props): WizardState {
  const [step, setStep] = useState<Step>(props.__initialStep || "welcome");
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
  };
}

export function OnboardingWizard(props: OnboardingWizard.Props) {
  const state = useOnboardingWizardState(props);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center px-4 py-8 bg-black/50 backdrop-blur-sm">
      <div
        className="w-full max-w-2xl bg-surface-base border border-surface-outline/60 rounded-2xl shadow-2xl focus:outline-none"
        role="dialog"
        aria-modal="true"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="mx-auto w-full max-w-2xl">
          {state.step === "welcome" && <WelcomeStep state={state} />}
          {state.step === "spaces" && <SpacesStep state={state} />}
          {state.step === "invite" && <InviteStep state={state} />}
          {state.step === "project" && <ProjectStep state={state} />}
        </div>
      </div>
    </div>
  );
}

type StepHeadingProps = {
  step: number;
  title: string;
  subtitle?: React.ReactNode;
};

function StepHeading({ step, title, subtitle }: StepHeadingProps) {
  return (
    <div className="max-w-2xl">
      <div className="uppercase text-xs mb-4">Step {step} of 3</div>
      <h1 className="text-2xl sm:text-2xl font-semibold text-content-accent focus:outline-none" tabIndex={-1}>
        {title}
      </h1>
      {subtitle && <p className="mt-1 text-content-dimmed">{subtitle}</p>}
    </div>
  );
}

function WizardStep({
  content,
  skip,
  next,
}: {
  content: React.ReactNode;
  skip?: React.ReactNode;
  next?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col">
      <div className="p-6">{content}</div>
      <div className="flex flex-col sm:flex-row gap-3 border-t py-4 px-6 w-full sm:justify-end">
        {skip}
        {next}
      </div>
    </div>
  );
}

function WelcomeStep({ state }: { state: WizardState }) {
  return (
    <WizardStep
      content={
        <div className="p-6 pt-10 flex flex-col items-center text-center mx-auto">
          <img
            src={PROFILE_IMAGE_URL}
            alt={PROFILE_IMAGE_ALT}
            className="w-[120px] h-[120px] rounded-full object-cover shadow-lg"
          />
          <div className="mt-6 max-w-lg text-left text-content-base space-y-4 text-center">
            <h1 className="font-semibold text-2xl">Thanks for joining Operately!</h1>
            <p>
              I'm thrilled to have you here. We built Operately to help teams work better together — to stay aligned,
              make progress visible, and keep everyone moving in the same direction.
            </p>
            <p>
              We'll walk you through a quick setup to get your workspace ready. It takes a few minutes, and you can
              always come back to this later.
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
      }
      next={<PrimaryButton onClick={state.next}>Let's get started</PrimaryButton>}
    />
  );
}

function SpacesStep({ state }: { state: WizardState }) {
  return (
    <WizardStep
      content={
        <div className="p-6">
          <StepHeading
            step={1}
            title="Set up spaces"
            subtitle={
              <>
                Spaces help you organize work by team or department.
                <br />
                Do you have any of these teams in your company?
              </>
            }
          />

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2" role="list">
            {SPACE_OPTIONS.map((space) => {
              const checked = state.selectedSpaces.includes(space);
              const handleToggle = (nextChecked: boolean) => state.toggleSpace(space, nextChecked);

              return (
                <div
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
      }
      next={
        <PrimaryButton onClick={state.next} size="sm">
          Next -&gt;
        </PrimaryButton>
      }
    />
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
      content={
        <div className="p-6">
          <StepHeading
            step={2}
            title="Invite your team"
            subtitle="Share this link to get your team on board with Operately."
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
      }
      next={
        <PrimaryButton onClick={state.next} size="sm">
          Next -&gt;
        </PrimaryButton>
      }
    />
  );
}

function ProjectStep({ state }: { state: WizardState }) {
  return (
    <WizardStep
      content={
        <div className="space-y-6 p-6">
          <StepHeading
            step={3}
            title="Starter project"
            subtitle="We've created a starter project to help your team get moving with a clear, straightforward plan."
          />
          <div className="relative overflow-hidden rounded-2xl border border-sky-300/70 bg-gradient-to-br from-sky-50 via-white to-slate-100 shadow-lg">
            <div className="pointer-events-none absolute -top-16 -left-10 h-40 w-40 rounded-full bg-sky-300/30 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 right-0 h-48 w-48 translate-x-1/4 translate-y-1/4 rounded-full bg-blue-200/40 blur-[90px]" />

            <div className="relative flex flex-col gap-6 p-6 sm:p-8">
              <span className="inline-flex items-center gap-2 self-start rounded-full bg-sky-600/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-700">
                <IconSparkles size={16} className="text-sky-500" />
                Strategic kickoff
              </span>

              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-content-accent">Get Started with Operately</h2>
                <p className="text-sm text-content-dimmed">
                  Operately’s starter project gives you an organized blueprint for aligning company strategy, goals, and
                  cross-functional execution from day one.
                </p>
              </div>

              <div className="space-y-3 text-sm text-content-base">
                <p className="text-xs font-semibold uppercase tracking-wide text-sky-700/80">Milestones you'll drive</p>
                <ChecklistItem icon={<IconFlag size={18} className="text-sky-500" strokeWidth={2} />}>
                  Define company outcomes and linked goals
                </ChecklistItem>
                <ChecklistItem icon={<IconFlag size={18} className="text-sky-500" strokeWidth={2} />}>
                  Plan initiatives with accountable owners
                </ChecklistItem>
                <ChecklistItem icon={<IconFlag size={18} className="text-sky-500" strokeWidth={2} />}>
                  Sequence milestones and dependencies
                </ChecklistItem>
                <ChecklistItem icon={<IconFlag size={18} className="text-sky-500" strokeWidth={2} />}>
                  Set up a repeatable cadence for status, accountability, and decision-making
                </ChecklistItem>
                <ChecklistItem icon={<IconTarget size={18} className="text-sky-600" strokeWidth={2} />}>
                  Rally teams around launch and review cadences
                </ChecklistItem>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-sky-200/80 bg-white/70 px-4 py-3 text-sm text-sky-900 shadow-sm backdrop-blur">
                <IconSparkles size={18} className="mt-0.5 text-sky-500" />
                <p>
                  We'll populate the project with best-practice roles, briefs, and check-in examples so you can
                  organize, communicate, and iterate the strategy before rolling it to the team.
                </p>
              </div>
            </div>
          </div>
        </div>
      }
      next={<PrimaryButton onClick={state.next}>Finish</PrimaryButton>}
    />
  );
}

function ChecklistItem({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 leading-snug">
      <span className="mt-0.5 text-sky-600">{icon}</span>
      <span>{children}</span>
    </div>
  );
}
