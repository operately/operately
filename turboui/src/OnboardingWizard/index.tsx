import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

import { GhostButton, PrimaryButton, SecondaryButton } from "../Button";
import { IconCheck, IconChevronLeft, IconCopy } from "../icons";

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
    __initialStep?: "welcome" | "spaces" | "invite" | "project"; // Defaults to "welcome", for testing purposes only.

    invitationLink: string;

    onComplete: (data: OnCompleteData) => void;
    onDismiss: () => void;
  }
}

type Step = "welcome" | "spaces" | "invite" | "project";

type WizardState = {
  currentStep: Step;
  spacesInput: string;
};

const PROFILE_IMAGE_URL = "https://pbs.twimg.com/profile_images/1631277097246179330/IpGRsar1_400x400.jpg";
const PROFILE_IMAGE_ALT = "Marko Anastasov profile photo";
const STORAGE_KEY = "operately:company-onboarding-wizard:v1";
const STEP_SEQUENCE: Step[] = ["welcome", "spaces", "invite", "project"];
const PROGRESS_STEPS: Step[] = ["spaces", "invite", "project"];
const FOCUSABLE_SELECTOR =
  'a[href], area[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function sanitizeSpaceNames(input: string): string[] {
  const taken = new Set<string>();
  const result: string[] = [];

  const parts = input
    .split(/[\n,]/)
    .map((piece) => piece.trim())
    .filter((piece) => piece.length > 0);

  for (const part of parts) {
    const normalized = part.toLocaleLowerCase();
    if (normalized === "general") continue;
    if (part.length > 100) continue;
    if (taken.has(normalized)) continue;

    taken.add(normalized);
    result.push(part);

    if (result.length === 10) break;
  }

  return result;
}

function persistWizardState(state: WizardState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Swallow storage errors silently.
  }
}

function clearWizardState() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage errors.
  }
}

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const nodes = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
  return nodes.filter((node) => !node.hasAttribute("disabled") && node.getAttribute("aria-hidden") !== "true");
}

export function OnboardingWizard(props: OnboardingWizard.Props) {
  const [state, setState] = useState<WizardState>(() => {
    return {
      currentStep: props.__initialStep || "welcome",
      spacesInput: "",
    };
  });

  const [copyStatus, setCopyStatus] = useState<"idle" | "copied">("idle");

  const headingId = useId();
  const descriptionId = useId();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const copyTimeoutRef = useRef<number | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const sanitizedSpaces = useMemo(() => sanitizeSpaceNames(state.spacesInput), [state.spacesInput]);

  useEffect(() => {
    persistWizardState(state);
  }, [state]);

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;

    const container = containerRef.current;
    const body = document.body;
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = body.style.overflow;

    const focusFirst = () => {
      const focusable = getFocusableElements(container);
      const first = focusable[0];
      if (first) {
        first.focus();
      } else {
        container.focus();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented) {
        event.preventDefault();
        props.onDismiss();
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = getFocusableElements(container);
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      const current = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (!current || current === first) {
          event.preventDefault();
          last.focus();
        }
      } else {
        if (!current || current === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    const handleFocusIn = (event: FocusEvent) => {
      if (!container.contains(event.target as Node)) {
        focusFirst();
      }
    };

    window.requestAnimationFrame(focusFirst);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("focusin", handleFocusIn);
    body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("focusin", handleFocusIn);
      body.style.overflow = previousOverflow;
      window.requestAnimationFrame(() => previouslyFocusedRef.current?.focus?.());
    };
  }, [props.onDismiss]);

  useEffect(() => {
    if (headingRef.current) {
      headingRef.current.focus();
    }
  }, [state.currentStep]);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        window.clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const goToStep = useCallback((step: Step) => {
    setState((prev) => ({ ...prev, currentStep: step }));
  }, []);

  const handleStart = useCallback(() => {
    goToStep("spaces");
  }, [goToStep]);

  const handleSpacesInputChange = useCallback((value: string) => {
    setState((prev) => ({ ...prev, spacesInput: value }));
  }, []);

  const handleSpacesContinue = useCallback(() => {
    goToStep("invite");
  }, [goToStep]);

  const handleInviteContinue = useCallback(() => {
    goToStep("project");
  }, [goToStep]);

  const handleBack = useCallback(() => {
    const currentIndex = STEP_SEQUENCE.indexOf(state.currentStep);
    if (currentIndex > 0) {
      const previousStep = STEP_SEQUENCE[currentIndex - 1];
      if (previousStep) {
        goToStep(previousStep);
      }
    }
  }, [goToStep, state.currentStep]);

  const completeWizard = useCallback(() => {
    clearWizardState();
    props.onComplete({ spaces: sanitizedSpaces });
  }, [props.onComplete, sanitizedSpaces]);

  const handleSkip = useCallback(() => {
    clearWizardState();
    props.onComplete({ spaces: sanitizedSpaces });
  }, [props.onComplete, sanitizedSpaces]);

  const handleDismiss = useCallback(() => {
    props.onDismiss();
  }, [props.onDismiss]);

  const handleCopy = useCallback(async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(props.invitationLink);
      } else {
        const fallbackInput = document.createElement("input");
        fallbackInput.value = props.invitationLink;
        document.body.appendChild(fallbackInput);
        fallbackInput.select();
        document.execCommand("copy");
        document.body.removeChild(fallbackInput);
      }
      setCopyStatus("copied");
      if (copyTimeoutRef.current) {
        window.clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = window.setTimeout(() => {
        setCopyStatus("idle");
        copyTimeoutRef.current = null;
      }, 2000);
    } catch {
      setCopyStatus("idle");
    }
  }, [props.invitationLink]);

  const currentStepIndex = PROGRESS_STEPS.indexOf(state.currentStep);
  const progressPercentage = currentStepIndex >= 0 ? ((currentStepIndex + 1) / PROGRESS_STEPS.length) * 100 : 0;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center px-4 py-8 bg-black/50 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          handleDismiss();
        }
      }}
    >
      <div
        ref={containerRef}
        className="w-full max-w-2xl bg-surface-base border border-surface-outline/60 rounded-2xl shadow-2xl focus:outline-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="mx-auto w-full max-w-2xl" id={descriptionId}>
          {state.currentStep === "welcome" && <WelcomeStep onGetStarted={handleStart} />}

          {state.currentStep === "spaces" && (
            <SpacesStep
              headingRef={headingRef}
              headingId={headingId}
              spacesInput={state.spacesInput}
              onChange={handleSpacesInputChange}
              onContinue={handleSpacesContinue}
              onSkip={handleSkip}
              sanitizedSpaces={sanitizedSpaces}
            />
          )}

          {state.currentStep === "invite" && (
            <InviteStep
              headingRef={headingRef}
              headingId={headingId}
              invitationLink={props.invitationLink}
              onContinue={handleInviteContinue}
              onSkip={handleSkip}
              onBack={handleBack}
              onCopy={handleCopy}
              copyStatus={copyStatus}
            />
          )}

          {state.currentStep === "project" && (
            <ProjectStep
              headingRef={headingRef}
              headingId={headingId}
              onFinish={completeWizard}
              onSkip={handleSkip}
              onBack={handleBack}
            />
          )}
        </div>
      </div>
    </div>
  );
}

type StepHeadingProps = {
  headingRef: React.MutableRefObject<HTMLHeadingElement | null>;
  headingId: string;
  title: string;
  subtitle?: string;
};

function StepHeading({ headingId, headingRef, title, subtitle }: StepHeadingProps) {
  return (
    <div className="max-w-2xl">
      <h1
        id={headingId}
        ref={headingRef}
        className="text-2xl sm:text-3xl font-semibold text-content-accent focus:outline-none"
        tabIndex={-1}
      >
        {title}
      </h1>
      {subtitle && <p className="mt-2 text-base text-content-dimmed">{subtitle}</p>}
    </div>
  );
}

type WelcomeStepProps = {
  onGetStarted: () => void;
};

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
    <div className="flex flex-col items-center">
      <div className="p-6">{content}</div>
      <div className="flex flex-col sm:flex-row gap-3 border-t py-4 px-6 w-full sm:justify-end">
        {skip}
        {next}
      </div>
    </div>
  );
}

function WelcomeStep({ onGetStarted }: WelcomeStepProps) {
  return (
    <WizardStep
      content={
        <div className="p-6 pt-10 flex flex-col items-center text-center">
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
      next={<PrimaryButton onClick={onGetStarted}>Let's get started</PrimaryButton>}
    />
  );
}

type SpacesStepProps = {
  headingRef: React.MutableRefObject<HTMLHeadingElement | null>;
  headingId: string;
  spacesInput: string;
  sanitizedSpaces: string[];
  onChange: (value: string) => void;
  onContinue: () => void;
  onSkip: () => void;
};

function SpacesStep({
  headingRef,
  headingId,
  spacesInput,
  sanitizedSpaces,
  onChange,
  onContinue,
  onSkip,
}: SpacesStepProps) {
  return (
    <WizardStep
      content={
        <>
          <StepHeading
            headingId={headingId}
            headingRef={headingRef}
            title="Set up spaces"
            subtitle="Spaces help your teams, departments, and initiatives stay organized. Create the ones you need to get started."
          />

          <div className="space-y-2">
            <label className="text-sm font-medium text-content-accent" htmlFor="onboarding-spaces-input">
              Which spaces should we create for you?
            </label>
            <textarea
              id="onboarding-spaces-input"
              value={spacesInput}
              onChange={(event) => onChange(event.target.value)}
              placeholder="Engineering, Product, Marketing"
              rows={3}
              className="w-full border border-surface-outline rounded-lg px-3 py-2 bg-surface-base text-sm text-content-base focus:outline-none focus:ring-2 focus:ring-brand-1"
            />
          </div>

          <p className="text-sm text-content-dimmed">
            Separate each space with a comma. We'll save up to 10 unique names, ignore blanks or "General", and skip
            anything longer than 100 characters.
          </p>

          {sanitizedSpaces.length > 0 && (
            <div>
              <div className="text-sm font-medium text-content-accent mb-2">We'll create these spaces:</div>
              <div className="flex flex-wrap gap-2">
                {sanitizedSpaces.map((space) => (
                  <span key={space} className="px-3 py-1 rounded-full bg-brand-1/10 text-brand-1 text-sm">
                    {space}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      }
      skip={<GhostButton onClick={onSkip}>Skip for now</GhostButton>}
      next={<PrimaryButton onClick={onContinue}>Continue</PrimaryButton>}
    />
  );
}

type InviteStepProps = {
  headingRef: React.MutableRefObject<HTMLHeadingElement | null>;
  headingId: string;
  invitationLink: string;
  onContinue: () => void;
  onSkip: () => void;
  onBack: () => void;
  onCopy: () => void;
  copyStatus: "idle" | "copied";
};

function InviteStep({
  headingRef,
  headingId,
  invitationLink,
  onContinue,
  onSkip,
  onBack,
  onCopy,
  copyStatus,
}: InviteStepProps) {
  return (
    <div className="space-y-6">
      <StepHeading
        headingId={headingId}
        headingRef={headingRef}
        title="Invite teammates"
        subtitle="Bring your teammates into the workspace so you can start collaborating right away."
      />

      <div className="space-y-3">
        <label className="text-sm font-medium text-content-accent" htmlFor="onboarding-invite-link">
          Share this invitation link
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            id="onboarding-invite-link"
            value={invitationLink}
            readOnly
            className="flex-1 min-w-0 px-3 py-2 border border-surface-outline rounded-lg bg-surface-base text-sm text-content-accent focus:outline-none focus:ring-2 focus:ring-brand-1"
            aria-label="Invitation link"
          />
          <PrimaryButton icon={copyStatus === "copied" ? IconCheck : IconCopy} onClick={onCopy}>
            {copyStatus === "copied" ? "Copied" : "Copy link"}
          </PrimaryButton>
        </div>
      </div>

      <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <SecondaryButton icon={IconChevronLeft} onClick={onBack}>
          Back
        </SecondaryButton>
        <div className="flex items-center gap-3">
          <GhostButton onClick={onSkip}>Skip for now</GhostButton>
          <PrimaryButton onClick={onContinue}>Continue</PrimaryButton>
        </div>
      </div>
    </div>
  );
}

type ProjectStepProps = {
  headingRef: React.MutableRefObject<HTMLHeadingElement | null>;
  headingId: string;
  onFinish: () => void;
  onSkip: () => void;
  onBack: () => void;
};

function ProjectStep({ headingRef, headingId, onFinish, onSkip, onBack }: ProjectStepProps) {
  return (
    <div className="space-y-6">
      <StepHeading
        headingId={headingId}
        headingRef={headingRef}
        title="Create your first project"
        subtitle="We'll spin up a guided project so you can explore how Operately keeps work organized."
      />

      <div className="bg-surface-highlight/60 border border-surface-outline rounded-xl p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-content-accent">"Launch New Customer Onboarding" project</h2>
          <p className="text-sm text-content-dimmed mt-2">
            A ready-to-use example that showcases goals, milestones, and tasks so you can learn by exploring.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-content-accent uppercase tracking-wide">What's inside</h3>
            <ul className="space-y-1 text-sm text-content-base list-disc list-inside">
              <li>Clear project goal with measurable outcomes</li>
              <li>Three suggested milestones to guide progress</li>
              <li>Starter tasks to demonstrate ownership and updates</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-content-accent uppercase tracking-wide">Tips included</h3>
            <ul className="space-y-1 text-sm text-content-base list-disc list-inside">
              <li>Best practices for weekly check-ins</li>
              <li>Guidance on assigning project roles</li>
              <li>Examples of progress updates your team will love</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <SecondaryButton icon={IconChevronLeft} onClick={onBack}>
          Back
        </SecondaryButton>
        <div className="flex items-center gap-3">
          <GhostButton onClick={onSkip}>Skip for now</GhostButton>
          <PrimaryButton onClick={onFinish}>Finish setup</PrimaryButton>
        </div>
      </div>
    </div>
  );
}
