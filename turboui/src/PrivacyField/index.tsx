import * as Popover from "@radix-ui/react-popover";
import * as React from "react";

import { match } from "ts-pattern";
import classNames from "../utils/classnames";

import { IconBuilding, IconChevronDown, IconLock, IconLockFilled, IconTent } from "../icons";
import { PrimaryButton, SecondaryButton } from "../Button";
import { createTestId } from "../TestableElement";

export const ACCESS_LEVELS = ["no_access", "view", "comment", "edit", "full"] as const;

export namespace PrivacyField {
  export type AccessLevel = (typeof ACCESS_LEVELS)[number];
  export type AccessLevels = { company: AccessLevel; space: AccessLevel };

  export interface Props {
    accessLevels: AccessLevels;
    setAccessLevels: (levels: AccessLevels) => void;

    spaceName: string;
    resourceType: "goal" | "project";

    placeholder?: string;
    readonly?: boolean;
    className?: string;
    iconSize?: number;
    textSize?: string;

    emptyStateText?: string;
    emptyStateReadonlyText?: string;

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
    spaceName: props.spaceName,
    resourceType: props.resourceType,
    placeholder: props.placeholder || "Select privacy level",
    readonly: props.readonly || false,
    className: props.className || "",
    iconSize: props.iconSize || 18,
    textSize: props.textSize || "text-sm",
    emptyStateText: props.emptyStateText || "Set privacy",
    emptyStateReadonlyText: props.emptyStateReadonlyText || "No privacy set",
    testId: props.testId || "privacy-field",
  };
}

export function PrivacyField(props: PrivacyField.Props) {
  const state = usePrivacyFieldState(props);

  const triggerClassName = classNames(
    "inline-block focus:outline-none",
    {
      "hover:bg-surface-dimmed rounded-lg px-1.5 py-1 -mx-1.5 -my-1": !state.readonly,
    },
    state.className,
  );

  return (
    <Popover.Root open={state.isOpen} onOpenChange={state.setIsOpen}>
      <Popover.Trigger className={triggerClassName} disabled={state.readonly} data-test-id={state.testId}>
        <PrivacyDisplay {...state} />
      </Popover.Trigger>

      <Popover.Portal>
        <PrivacyPickerPopover {...state} />
      </Popover.Portal>
    </Popover.Root>
  );
}

function PrivacyPickerPopover(props: PrivacyField.State) {
  const [tempCompanyAccess, setTempCompanyAccess] = React.useState<PrivacyField.AccessLevel>(
    props.accessLevels.company,
  );
  const [tempSpaceAccess, setTempSpaceAccess] = React.useState<PrivacyField.AccessLevel>(props.accessLevels.space);

  const tempAccessLevels = {
    company: tempCompanyAccess,
    space: tempSpaceAccess,
  };

  const setTempAccessLevels = (levels: { company: PrivacyField.AccessLevel; space: PrivacyField.AccessLevel }) => {
    setTempCompanyAccess(levels.company);
    setTempSpaceAccess(levels.space);
  };

  React.useEffect(() => {
    setTempCompanyAccess(props.accessLevels.company);
    setTempSpaceAccess(props.accessLevels.space);
  }, [props.accessLevels]);

  const handleSave = () => {
    setTempCompanyAccess(tempCompanyAccess);
    setTempSpaceAccess(tempSpaceAccess);

    props.setAccessLevels({
      company: tempCompanyAccess,
      space: tempSpaceAccess,
    });

    props.setIsOpen(false);
  };

  const handleCancel = () => {
    setTempCompanyAccess(props.accessLevels.company);
    setTempSpaceAccess(props.accessLevels.space);
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

  const elemClass = classNames(
    {
      "flex items-start gap-1.5 text-left": true,
    },
    textSize,
    props.className,
  );

  const text = getPrivacyTitle(props.accessLevels, props.spaceName);
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

function getPrivacyTitle(levels: PrivacyField.AccessLevels, spaceName: string) {
  return match([levels.company, levels.space])
    .with(["no_access", "no_access"], () => "Only assigned people have access")
    .with(["no_access", "view"], () => `Only ${spaceName} members can view`)
    .with(["no_access", "comment"], () => `Only ${spaceName} members can comment`)
    .with(["no_access", "edit"], () => `Only ${spaceName} members can edit`)
    .with(["no_access", "full"], () => `${spaceName} members have full access`)
    .with(["view", "view"], () => `Everyone in the company can view`)
    .with(["view", "comment"], () => `Everyone in the company can view, ${spaceName} members can comment`)
    .with(["view", "edit"], () => `Everyone in the company can view, ${spaceName} members can edit`)
    .with(["view", "full"], () => `Everyone in the company can view, ${spaceName} members have full access`)
    .with(["comment", "comment"], () => `Everyone in the company can comment`)
    .with(["comment", "edit"], () => `Everyone in the company can comment, ${spaceName} members can edit`)
    .with(["comment", "full"], () => `Everyone in the company can comment, ${spaceName} members have full access`)
    .with(["edit", "edit"], () => `Everyone in the company can edit`)
    .with(["edit", "full"], () => `Everyone in the company can edit, ${spaceName} members have full access`)
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
    <div className="px-2 py-1 border border-surface-outline rounded-md text-sm bg-surface-base grid items-center">
      <select
        data-test-id={testId}
        className="appearance-none col-start-1 row-start-1"
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
