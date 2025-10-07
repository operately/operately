import React, { useEffect, useMemo, useRef, useState } from "react";

import { match } from "ts-pattern";
import { Avatar } from "../Avatar";
import { PrimaryButton, SecondaryButton } from "../Button";
import { IconUpload } from "../icons";
import { TextField } from "../TextField";
import { WelcomeStep } from "./WelcomeStep";
import { useWizardState, WizardState } from "./WizadState";
import { WizardHeading, WizardModal, WizardStep } from "./WizardLayout";

export namespace CompanyMemberOnboardingWizard {
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
    __initialStep?: Step;

    onComplete: (data: OnCompleteData) => void;
    onDismiss: () => void;
    initialAvatarUrl?: string | null;
    profileImageUrl: string;
  }

  export interface State extends WizardState {
    role: string;
    setRole: (role: string) => void;

    avatar: CompanyMemberOnboardingWizard.AvatarData | null;
    setAvatar: (avatar: CompanyMemberOnboardingWizard.AvatarData | null) => void;

    complete: () => void;
    canProceedFromRole: boolean;
    canFinish: boolean;
    profileImageUrl: string;
  }
}

const STEP_SEQUENCE: CompanyMemberOnboardingWizard.Step[] = ["welcome", "role", "avatar"];

function generateId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function CompanyMemberOnboardingWizard(props: CompanyMemberOnboardingWizard.Props) {
  const state = useWizardState(props.__initialStep || "welcome", STEP_SEQUENCE, props.onDismiss);

  return (
    <WizardModal labelledBy="company-member-onboarding-heading" onDismiss={props.onDismiss}>
      {match(state.currentStep)
        .with("welcome", () => <WelcomeStep state={state} imageUrl={props.profileImageUrl} whatReady="profile" />)
        .with("role", () => <RoleStep state={state} />)
        .with("avatar", () => <AvatarStep state={state} />)
        .run()}
    </WizardModal>
  );
}

function RoleStep({ state }: { state: WizardState }) {
  const [validRole, setValidRole] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setValidRole(state.role.trim().length > 0);
  }, [state.role]);

  return (
    <WizardStep
      footer={
        <>
          <SecondaryButton onClick={state.back}>Back</SecondaryButton>
          <PrimaryButton onClick={state.next} disabled={!validRole}>
            Next
          </PrimaryButton>
        </>
      }
    >
      <div className="space-y-6">
        <WizardHeading
          stepNumber={1}
          totalSteps={2}
          title="What's your role?"
          subtitle="Let teammates know what you focus on. You can change this later."
          id="company-member-onboarding-heading"
        />
        <TextField
          variant="form-field"
          label="Your role"
          placeholder="e.g Product Manager, Designer, CEO"
          text={state.role}
          onChange={state.setRole}
          trimBeforeSave={false}
          inputRef={inputRef}
        />
      </div>
    </WizardStep>
  );
}

function AvatarStep({ state }: { state: WizardState }) {
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
      footer={
        <PrimaryButton onClick={state.complete} disabled={!state.canFinish}>
          Finish
        </PrimaryButton>
      }
    >
      <div className="space-y-6">
        <WizardHeading
          stepNumber={2}
          totalSteps={2}
          title="Add your profile picture"
          subtitle="Help your teammates put a face to your name."
          id="company-member-onboarding-heading"
        />

        <div className="flex flex-col sm:flex-row items-center gap-6">
          <label className="flex items-center justify-center rounded-full border border-dashed border-surface-outline bg-surface-base/80 p-4 cursor-pointer focus-within:ring-2 focus-within:ring-brand-1">
            {state.avatar ? (
              <Avatar person={avatarPerson!} size={96} />
            ) : (
              <div className="flex flex-col items-center justify-center text-content-dimmed px-6 py-4">
                <IconUpload size={36} aria-hidden="true" />
                <span className="mt-2 text-sm">Upload a square image for best results.</span>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </label>

          <div className="flex flex-col items-center sm:items-start gap-3">
            <PrimaryButton size="sm" onClick={() => fileInputRef.current?.click()}>
              {state.avatar ? "Replace photo" : "Upload photo"}
            </PrimaryButton>
            {state.avatar && (
              <SecondaryButton size="sm" onClick={handleRemove}>
                Remove photo
              </SecondaryButton>
            )}
            <p className="text-xs text-content-dimmed max-w-sm text-center sm:text-left">
              PNG, JPG, or GIF up to 5MB. You can adjust or replace it later from your profile settings.
            </p>
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        </div>
      </div>
    </WizardStep>
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
