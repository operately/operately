import * as Popover from "@radix-ui/react-popover";
import React from "react";
import { match } from "ts-pattern";
import classNames from "../utils/classnames";

import { PrimaryButton, SecondaryButton } from "../Button";
import { IconBuilding, IconChevronDown, IconLock, IconLockFilled, IconTent } from "../icons";
import { createTestId } from "../TestableElement";

export const ACCESS_LEVELS = ["no_access", "view", "comment", "edit", "full"] as const;

export namespace PrivacyField {
  export type AccessLevel = (typeof ACCESS_LEVELS)[number];
  export type AccessLevels = { company: AccessLevel; space: AccessLevel };

  export interface Props {
    accessLevels: AccessLevels;
    setAccessLevels: (levels: AccessLevels) => void;

    resourceType: "goal" | "project";

    variant?: "inline" | "form-field";
    label?: string;
    error?: string;
    placeholder?: string;
    readonly?: boolean;
    className?: string;
    iconSize?: number;
    textSize?: string;

    emptyStateText?: string;
    emptyStateReadonlyText?: string;

    hideCompanyAccess?: boolean;

    testId?: string;
  }

  export interface State extends Required<Props> {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
  }
}

function usePrivacyFieldState(props: PrivacyField.Props): PrivacyField.State {
  const [isOpen, setIsOpen] = React.useState(false);

  return {
    isOpen,
    setIsOpen,
    accessLevels: props.accessLevels,
    setAccessLevels: props.setAccessLevels,
    resourceType: props.resourceType,
    variant: props.variant || "inline",
    label: props.label || "",
    error: props.error || "",
    placeholder: props.placeholder || "Select privacy level",
    readonly: props.readonly || false,
    className: props.className || "",
    iconSize: props.iconSize || 18,
    textSize: props.textSize || "text-sm",
    emptyStateText: props.emptyStateText || "Set privacy",
    emptyStateReadonlyText: props.emptyStateReadonlyText || "No privacy set",
    hideCompanyAccess: props.hideCompanyAccess || false,
    testId: props.testId || "privacy-field",
  };
}

export function PrivacyField(props: PrivacyField.Props) {
  const state = usePrivacyFieldState(props);

  if (state.variant === "form-field") {
    return <FormFieldPrivacyField {...state} />;
  } else {
    return <InlinePrivacyField {...state} />;
  }
}

function PrivacyPickerPopover(props: PrivacyField.State) {
  const [tempAccessLevels, setTempAccessLevels] = React.useState<PrivacyField.AccessLevels>({
    company: props.accessLevels.company,
    space: props.accessLevels.space,
  });

  React.useEffect(() => setTempAccessLevels(props.accessLevels), [props.accessLevels]);

  const handleSave = () => {
    props.setAccessLevels(tempAccessLevels);
    props.setIsOpen(false);
  };

  const handleCancel = () => {
    setTempAccessLevels(props.accessLevels);
    props.setIsOpen(false);
  };

  return (
    <Popover.Content
      className="bg-surface-base shadow-lg border border-surface-outline rounded-md z-50 w-96"
      sideOffset={5}
    >
      <div className="p-4">
        <div className="mb-3">
          <div className="text-sm font-medium">Privacy Settings</div>
        </div>

        <AccessLevelOptions {...props} accessLevels={tempAccessLevels} setAccessLevels={setTempAccessLevels} />

        <div className="flex justify-end gap-2 mt-4">
          <SecondaryButton size="xs" onClick={handleCancel} testId="cancel">
            Cancel
          </SecondaryButton>
          <PrimaryButton size="xs" onClick={handleSave} testId="save">
            Save
          </PrimaryButton>
        </div>
      </div>

      <Popover.Arrow />
    </Popover.Content>
  );
}

function PrivacyDisplay(props: PrivacyField.State) {
  const iconSize = props.iconSize;
  const textSize = props.textSize;
  const variant = props.variant || "inline";

  const elemClass = classNames(
    {
      "flex items-start gap-1.5 text-left": true,
      "w-full": variant === "form-field",
    },
    textSize,
  );

  const text = getPrivacyTitle(props.accessLevels);
  const icon = getPrivacyIcon(props.accessLevels, iconSize);

  return (
    <span className={elemClass}>
      {icon}
      <span>{text}</span>
    </span>
  );
}

function getPrivacyIcon(levels: PrivacyField.AccessLevels, size: number) {
  if (levels.company !== "no_access") return <IconBuilding size={size} className="shrink-0" />;
  if (levels.space !== "no_access") return <IconLock size={size} className="shrink-0" />;

  return <IconLockFilled size={size} className="text-content-error shrink-0" />;
}

function getPrivacyTitle(levels: PrivacyField.AccessLevels) {
  return match([levels.company, levels.space])
    .with(["no_access", "no_access"], () => "Only assigned people have access")
    .with(["no_access", "view"], () => `Only space members can view`)
    .with(["no_access", "comment"], () => `Only space members can comment`)
    .with(["no_access", "edit"], () => `Only space members can edit`)
    .with(["no_access", "full"], () => `Space members have full access`)
    .with(["view", "view"], () => `Everyone in the company can view`)
    .with(["view", "comment"], () => `Company members can view, space members can comment`)
    .with(["view", "edit"], () => `Company members can view, space members can edit`)
    .with(["view", "full"], () => `Company members can view, space members have full access`)
    .with(["comment", "comment"], () => `Everyone in the company can comment`)
    .with(["comment", "edit"], () => `Company members can comment, space members can edit`)
    .with(["comment", "full"], () => `Company members can comment, space members have full access`)
    .with(["edit", "edit"], () => `Everyone in the company can edit`)
    .with(["edit", "full"], () => `Company members can edit, space members have full access`)
    .with(["full", "full"], () => `Everyone in the company has full access`)
    .otherwise(() => {
      throw new Error("Invalid access levels: " + JSON.stringify(levels));
    });
}

const LEVEL_NAME: Record<PrivacyField.AccessLevel, string> = {
  no_access: "No Access",
  view: "View Access",
  comment: "Comment Access",
  edit: "Edit Access",
  full: "Full Access",
};

function AccessLevelOptions(props: PrivacyField.State) {
  const setCompanyLevel = (level: PrivacyField.AccessLevel) => {
    props.setAccessLevels({
      ...props.accessLevels,
      company: level,
    });

    if (lessThan(props.accessLevels.space, level)) {
      props.setAccessLevels({
        ...props.accessLevels,
        space: level,
      });
    }
  };

  const setSpaceLevel = (level: PrivacyField.AccessLevel) => {
    props.setAccessLevels({
      ...props.accessLevels,
      space: level,
    });
  };

  const visibleCompanyAccessLevels = ["no_access", "view", "comment", "edit", "full"] as const;

  const visibleSpaceAccessLevels = match(props.accessLevels.company)
    .with("no_access", () => ["no_access", "view", "comment", "edit", "full"])
    .with("view", () => ["view", "comment", "edit", "full"])
    .with("comment", () => ["comment", "edit", "full"])
    .with("edit", () => ["edit", "full"])
    .with("full", () => ["full"])
    .exhaustive();

  return (
    <div>
      {!props.hideCompanyAccess && (
        <div className="py-2">
          <div className="flex items-center gap-2 justify-between">
            <div className="flex items-center gap-2">
              <IconBuilding size={18} className="-mt-[1px]" />
              <label className="text-sm">Company Members</label>
            </div>

            <div className="w-40">
              <SelectBox
                testId={createTestId(props.testId, "company-select")}
                value={props.accessLevels.company}
                onChange={setCompanyLevel}
                options={visibleCompanyAccessLevels.map((level) => ({
                  value: level,
                  label: LEVEL_NAME[level],
                }))}
              />
            </div>
          </div>
        </div>
      )}

      <div className="py-2">
        <div className="flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            <IconTent size={18} className="-mt-[1px]" />
            <label className="text-sm">Space Members</label>
          </div>

          <div className="w-40">
            <SelectBox
              testId={createTestId(props.testId, "space-select")}
              value={props.accessLevels.space}
              onChange={setSpaceLevel}
              options={visibleSpaceAccessLevels.map((level) => ({
                value: level,
                label: LEVEL_NAME[level],
              }))}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function SelectBox({
  value,
  onChange,
  options,
  testId,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  testId: string;
}) {
  return (
    <div className="px-2 py-1 border border-surface-outline rounded-md text-sm grid items-center">
      <select
        data-test-id={testId}
        className="appearance-none col-start-1 row-start-1 bg-transparent"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <div className="col-start-1 row-start-1 pointer-events-none w-full flex items-center justify-end">
        <IconChevronDown size={16} className="" />
      </div>
    </div>
  );
}

function FormFieldPrivacyField(state: PrivacyField.State) {
  const outerClass = classNames(
    "flex items-center justify-between gap-2",
    "cursor-pointer relative w-full border rounded-lg px-2 py-1.5 bg-surface-base",
    "focus-within:outline outline-indigo-600 bg-transparent",
    state.error ? "border-red-500 outline-red-500" : "border-surface-outline",
  );

  return (
    <div className={state.className}>
      {state.label && <label className="font-bold text-sm mb-1 block text-left">{state.label}</label>}
      <Popover.Root open={state.isOpen} onOpenChange={state.setIsOpen}>
        <Popover.Trigger asChild disabled={state.readonly}>
          <div className={outerClass} data-test-id={state.testId}>
            <PrivacyDisplay {...state} />
            <IconChevronDown size={16} className="text-content-subtle" />
          </div>
        </Popover.Trigger>

        <Popover.Portal>
          <PrivacyPickerPopover {...state} />
        </Popover.Portal>
      </Popover.Root>
      {state.error && <div className="text-red-500 text-xs mt-1 mb-1">{state.error}</div>}
    </div>
  );
}

function InlinePrivacyField(state: PrivacyField.State) {
  const triggerClassName = classNames(
    "inline-block focus:outline-none",
    {
      "hover:bg-surface-dimmed rounded-lg px-1.5 py-1 -mx-1.5 -my-1": !state.readonly,
    },
    state.className,
  );

  return (
    <div className={state.className}>
      {state.label && <label className="font-bold text-sm mb-1 block text-left">{state.label}</label>}
      <Popover.Root open={state.isOpen} onOpenChange={state.setIsOpen}>
        <Popover.Trigger className={triggerClassName} disabled={state.readonly} data-test-id={state.testId}>
          <PrivacyDisplay {...state} />
        </Popover.Trigger>

        <Popover.Portal>
          <PrivacyPickerPopover {...state} />
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}

function lessThan(a: PrivacyField.AccessLevel, b: PrivacyField.AccessLevel): boolean {
  const levels = ["no_access", "view", "comment", "edit", "full"] as const;
  return levels.indexOf(a) < levels.indexOf(b);
}
