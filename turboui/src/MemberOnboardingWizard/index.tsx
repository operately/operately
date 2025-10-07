import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Avatar } from "../Avatar";
import { PrimaryButton, SecondaryButton } from "../Button";
import { IconUpload, IconX } from "../icons";
import { TextField } from "../TextField";

export namespace MemberOnboardingWizard {
  export interface AvatarData {
    id: string;
    name: string;
    url: string;
    size?: number;
    type?: string;
    file?: File | null;
  }

  export interface OnCompleteData {
    role: string;
    avatar: AvatarData;
  }

  export type Step = "welcome" | "role" | "avatar";

  export interface Props {
    /**
     * Testing hook to jump to a specific step in Storybook.
     */
    __initialStep?: Step;

    onComplete: (data: OnCompleteData) => void;
    onDismiss: () => void;

    /**
     * Prefill state when re-opening the wizard.
     */
    defaultRole?: string;
    initialAvatarUrl?: string | null;

    welcomeImageUrl?: string;
    welcomeImageAlt?: string;
  }
}

const STEP_SEQUENCE: MemberOnboardingWizard.Step[] = ["welcome", "role", "avatar"];
const DEFAULT_PROFILE_PHOTO =
  "https://pbs.twimg.com/profile_images/1631277097246179330/IpGRsar1_400x400.jpg";

type WizardState = {
  step: MemberOnboardingWizard.Step;
  goToStep: (step: MemberOnboardingWizard.Step) => void;
  next: () => void;
  back: () => void;
  dismiss: () => void;

  role: string;
  setRole: (role: string) => void;

  avatar: MemberOnboardingWizard.AvatarData | null;
  setAvatar: (avatar: MemberOnboardingWizard.AvatarData | null) => void;

  complete: () => void;
  canProceedFromRole: boolean;
  canFinish: boolean;
  welcomeImageUrl: string;
  welcomeImageAlt: string;
};

function generateId(prefix: string) {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function useWizardState(props: MemberOnboardingWizard.Props): WizardState {
  const [step, setStep] = useState<MemberOnboardingWizard.Step>(props.__initialStep || "welcome");
  const [role, setRole] = useState(() => props.defaultRole || "");
  const [avatar, setAvatar] = useState<MemberOnboardingWizard.AvatarData | null>(() => {
    if (!props.initialAvatarUrl) return null;

    return {
      id: generateId("existing-avatar"),
      name: "Current avatar",
      url: props.initialAvatarUrl,
    };
  });

  const goToStep = useCallback((nextStep: MemberOnboardingWizard.Step) => {
    setStep(nextStep);
  }, []);

  const next = useCallback(() => {
    setStep((current) => {
      const index = STEP_SEQUENCE.indexOf(current);
      if (index === -1) return current;
      return STEP_SEQUENCE[Math.min(index + 1, STEP_SEQUENCE.length - 1)]!;
    });
  }, []);

  const back = useCallback(() => {
    setStep((current) => {
      const index = STEP_SEQUENCE.indexOf(current);
      if (index <= 0) return current;
      return STEP_SEQUENCE[Math.max(index - 1, 0)]!;
    });
  }, []);

  const complete = useCallback(() => {
    const trimmedRole = role.trim();
    if (!avatar || !trimmedRole) return;

    props.onComplete({
      role: trimmedRole,
      avatar,
    });
  }, [avatar, props, role]);

  return {
    step,
    goToStep,
    next,
    back,
    dismiss: props.onDismiss,
    role,
    setRole,
    avatar,
    setAvatar,
    complete,
    canProceedFromRole: role.trim().length > 0,
    canFinish: !!avatar,
    welcomeImageUrl: props.welcomeImageUrl || DEFAULT_PROFILE_PHOTO,
    welcomeImageAlt: props.welcomeImageAlt || "Marko Anastasov profile photo",
  };
}

export function MemberOnboardingWizard(props: MemberOnboardingWizard.Props) {
  const state = useWizardState(props);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        props.onDismiss();
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [props]);

  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (dialogRef.current && dialogRef.current.contains(event.target as Node)) {
      return;
    }

    state.dismiss();
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center px-4 py-8 bg-black/50 backdrop-blur-sm"
      role="presentation"
      onMouseDown={handleOverlayClick}
    >
      <div
        ref={dialogRef}
        className="relative w-full max-w-2xl bg-surface-base border border-surface-outline/60 rounded-2xl shadow-2xl focus:outline-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="member-onboarding-heading"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="absolute right-4 top-4 inline-flex items-center justify-center rounded-full border border-surface-outline bg-surface-base p-2 text-content-dimmed transition hover:text-content-accent hover:bg-surface-accent focus:outline-none focus:ring-2 focus:ring-brand-1"
          onClick={state.dismiss}
          aria-label="Close onboarding wizard"
        >
          <IconX size={18} aria-hidden="true" />
        </button>

        {state.step === "welcome" && <WelcomeStep state={state} />}
        {state.step === "role" && <RoleStep state={state} />}
        {state.step === "avatar" && <AvatarStep state={state} />}
      </div>
    </div>
  );
}

function WizardStep({
  content,
  footer,
}: {
  content: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="flex flex-col">
      <div className="p-6 sm:p-8">{content}</div>
      <div className="flex flex-col sm:flex-row gap-3 border-t py-4 px-6 w-full sm:justify-end">{footer}</div>
    </div>
  );
}

function WelcomeStep({ state }: { state: WizardState }) {
  return (
    <WizardStep
      content={
        <div className="flex flex-col items-center text-center mx-auto pt-8 pb-4 px-4">
          <img
            src={state.welcomeImageUrl}
            alt={state.welcomeImageAlt}
            className="w-[120px] h-[120px] rounded-full object-cover shadow-lg"
          />
          <div className="mt-6 max-w-lg text-content-base space-y-4">
            <h1 className="font-semibold text-2xl" id="member-onboarding-heading">
              Thanks for joining Operately!
            </h1>
            <p>
              I'm thrilled to have you here. We built Operately to help teams work better together — to stay aligned,
              make progress visible, and keep everyone moving in the same direction.
            </p>
            <p>
              We'll walk you through a quick setup to get your workspace ready. It takes just a few minutes, and you can
              always come back to this later.
            </p>
            <p className="italic">
              If you ever need help, reach out at support@operately.com — we're here for you.
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
      }
      footer={
        <>
          <SecondaryButton onClick={state.dismiss}>Skip for now</SecondaryButton>
          <PrimaryButton onClick={state.next}>Next</PrimaryButton>
        </>
      }
    />
  );
}

function StepHeading({
  stepNumber,
  totalSteps,
  title,
  subtitle,
}: {
  stepNumber: number;
  totalSteps: number;
  title: string;
  subtitle?: React.ReactNode;
}) {
  return (
    <div className="max-w-2xl">
      <div className="uppercase text-xs mb-4 text-content-dimmed">Step {stepNumber} of {totalSteps}</div>
      <h1 className="text-2xl font-semibold text-content-accent focus:outline-none" tabIndex={-1} id="member-onboarding-heading">
        {title}
      </h1>
      {subtitle && <p className="mt-2 text-content-dimmed">{subtitle}</p>}
    </div>
  );
}

function RoleStep({ state }: { state: WizardState }) {
  const totalSteps = STEP_SEQUENCE.length;
  const roleInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (roleInputRef.current) {
      roleInputRef.current.focus();
    }
  }, []);

  return (
    <WizardStep
      content={
        <div className="space-y-6">
          <StepHeading
            stepNumber={2}
            totalSteps={totalSteps}
            title="What's your role?"
            subtitle="Let teammates know what you focus on. You can change this later."
          />
          <TextField
            variant="form-field"
            label="Your role"
            placeholder="Software Engineer"
            text={state.role}
            onChange={state.setRole}
            inputRef={roleInputRef}
            trimBeforeSave={false}
          />
        </div>
      }
      footer={
        <>
          <SecondaryButton onClick={state.back}>Back</SecondaryButton>
          <PrimaryButton onClick={state.next} disabled={!state.canProceedFromRole}>
            Next
          </PrimaryButton>
        </>
      }
    />
  );
}

function AvatarStep({ state }: { state: WizardState }) {
  const totalSteps = STEP_SEQUENCE.length;
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError("Please choose an image smaller than 5MB.");
      return;
    }

    setError(null);

    const dataUrl = await readFileAsDataURL(file);

    state.setAvatar({
      id: generateId("avatar"),
      name: file.name,
      url: dataUrl,
      size: file.size,
      type: file.type,
      file,
    });
  };

  const handleRemove = () => {
    state.setAvatar(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const avatarPerson = useMemo(() => {
    if (!state.avatar) return null;
    return {
      id: state.avatar.id,
      fullName: state.role || "You",
      avatarUrl: state.avatar.url,
    };
  }, [state.avatar, state.role]);

  return (
    <WizardStep
      content={
        <div className="space-y-6">
          <StepHeading
            stepNumber={3}
            totalSteps={totalSteps}
            title="Add your profile picture"
            subtitle="Help your teammates put a face to your name."
          />

          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="flex items-center justify-center rounded-full border border-dashed border-surface-outline bg-surface-base/80 p-4">
              {state.avatar ? (
                <Avatar person={avatarPerson!} size={96} />
              ) : (
                <div className="flex flex-col items-center justify-center text-content-dimmed px-6 py-4">
                  <IconUpload size={36} aria-hidden="true" />
                  <span className="mt-2 text-sm">Upload a square image for best results.</span>
                </div>
              )}
            </div>

            <div className="flex flex-col items-center sm:items-start gap-3">
              <PrimaryButton size="sm" onClick={() => fileInputRef.current?.click()}>
                {state.avatar ? "Replace photo" : "Upload photo"}
              </PrimaryButton>
              {state.avatar && (
                <SecondaryButton size="sm" onClick={handleRemove}>
                  Remove photo
                </SecondaryButton>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <p className="text-xs text-content-dimmed max-w-sm text-center sm:text-left">
                PNG, JPG, or GIF up to 5MB. You can adjust or replace it later from your profile settings.
              </p>
              {error && <p className="text-xs text-red-500">{error}</p>}
            </div>
          </div>
        </div>
      }
      footer={
        <>
          <SecondaryButton onClick={state.back}>Back</SecondaryButton>
          <PrimaryButton onClick={state.complete} disabled={!state.canFinish}>
            Finish
          </PrimaryButton>
        </>
      }
    />
  );
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };
    reader.readAsDataURL(file);
  });
}
