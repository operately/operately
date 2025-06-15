import * as Popover from "@radix-ui/react-popover";
import { IconBuilding, IconChevronDown, IconLock, IconLockFilled, IconWorld } from "@tabler/icons-react";
import React, { useState } from "react";
import { match } from "ts-pattern";
import classNames from "../utils/classnames";

const PRIVACY_LEVELS = ["public", "internal", "confidential", "secret"] as const;
type PrivacyLevels = (typeof PRIVACY_LEVELS)[number];

interface PrivacyFieldProps {
  privacyLevel: PrivacyLevels | null;
  setPrivacyLevel?: (level: PrivacyLevels | null) => void;
  spaceName?: string;
  resourceType?: "goal" | "project";

  placeholder?: string;
  readonly?: boolean;
  className?: string;
  iconSize?: number;
  textSize?: string;

  showIcon?: boolean;
  emptyStateText?: string;
  emptyStateReadonlyText?: string;

  variant?: "inline" | "form-field";
}

export function PrivacyField({
  privacyLevel,
  setPrivacyLevel = () => {},
  spaceName = "Team",
  resourceType = "project",
  readonly = false,
  iconSize = 18,
  textSize = "text-sm",
  variant = "inline",
  className = "",
  showIcon = true,
  emptyStateText = "Set privacy",
  emptyStateReadonlyText = "No privacy set",
}: PrivacyFieldProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleChange = (newLevel: PrivacyField.PrivacyLevels | null) => {
    if (privacyLevel !== newLevel) {
      setPrivacyLevel(newLevel);
      setIsOpen(false); // Close popover after privacy selection
    }
  };

  const triggerClassName = classNames(
    "inline-block focus:outline-none",
    {
      "hover:bg-surface-dimmed rounded-lg px-1.5 py-1 -mx-1.5 -my-1": variant === "inline" && !readonly,
      "border border-surface-outline rounded-lg w-full hover:bg-surface-dimmed px-2 py-1.5": variant === "form-field",
    },
    className,
  );

  return (
    <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
      <Popover.Trigger className={triggerClassName} disabled={readonly}>
        <PrivacyDisplay
          privacyLevel={privacyLevel}
          spaceName={spaceName}
          resourceType={resourceType}
          className={className}
          readonly={readonly}
          showIcon={showIcon}
          emptyStateText={emptyStateText}
          emptyStateReadonlyText={emptyStateReadonlyText}
          iconSize={iconSize}
          textSize={textSize}
          variant={variant}
        />
      </Popover.Trigger>
      <Popover.Portal>
        <PrivacyPickerPopover
          privacyLevel={privacyLevel}
          setNewPrivacyLevel={handleChange}
          spaceName={spaceName}
          resourceType={resourceType}
        />
      </Popover.Portal>
    </Popover.Root>
  );
}

const PrivacyPickerPopover = React.forwardRef<
  HTMLDivElement,
  {
    privacyLevel?: PrivacyLevels | null;
    setNewPrivacyLevel: (level: PrivacyLevels | null) => void;
    spaceName: string;
    resourceType: "goal" | "project";
  }
>(({ privacyLevel, setNewPrivacyLevel, spaceName, resourceType }, ref) => (
  <Popover.Content
    ref={ref}
    className="bg-surface-base shadow-lg border border-surface-outline rounded-md z-50 w-80"
    sideOffset={5}
  >
    <div className="p-3">
      <div className="text-sm font-medium mb-3">Privacy Settings</div>

      <div className="space-y-2">
        {PRIVACY_LEVELS.map((level) => (
          <PrivacyOption
            key={level}
            level={level}
            isSelected={privacyLevel === level}
            onClick={() => setNewPrivacyLevel(level)}
            spaceName={spaceName}
            resourceType={resourceType}
          />
        ))}
      </div>
    </div>

    <Popover.Arrow />
  </Popover.Content>
));

interface PrivacyOptionProps {
  level: PrivacyLevels;
  isSelected: boolean;
  onClick: () => void;
  spaceName: string;
  resourceType: "goal" | "project";
}

function PrivacyOption({ level, isSelected, onClick, spaceName, resourceType }: PrivacyOptionProps) {
  const icon = getPrivacyIcon(level, 18);
  const title = getPrivacyTitle(level, spaceName);
  const description = getPrivacyDescription(level, spaceName, resourceType);

  return (
    <button
      onClick={onClick}
      className={classNames("w-full text-left p-3 rounded-lg border transition-colors", {
        "border-accent-1 bg-accent-1/5": isSelected,
        "border-surface-outline hover:bg-surface-dimmed": !isSelected,
      })}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm">{title}</div>
          <div className="text-xs text-content-dimmed mt-1">{description}</div>
        </div>
      </div>
    </button>
  );
}

interface PrivacyDisplayProps {
  privacyLevel: PrivacyLevels | null | undefined;
  spaceName: string;
  resourceType: "goal" | "project";
  className: string;
  readonly: boolean;

  iconSize: number;
  textSize: string;
  showIcon: boolean;

  emptyStateText: string;
  emptyStateReadonlyText: string;

  variant?: "inline" | "form-field";
}

function PrivacyDisplay(props: PrivacyDisplayProps) {
  const iconSize = props.iconSize;
  const textSize = props.textSize;
  const variant = props.variant || "inline";

  const elemClass = classNames(
    {
      "flex items-center": true,
      "gap-1.5": props.showIcon,
      "text-content-dimmed": !props.privacyLevel,
      "w-full": variant === "form-field",
      "justify-between": variant === "form-field" && !props.readonly,
    },
    textSize,
    props.className,
  );

  let text = "";
  let icon: React.ReactElement | null = null;

  if (props.privacyLevel) {
    text = getPrivacyTitle(props.privacyLevel, props.spaceName);
    icon = props.showIcon ? getPrivacyIcon(props.privacyLevel, iconSize) : null;
  } else if (props.readonly) {
    text = props.emptyStateReadonlyText;
    icon = props.showIcon ? <IconLock size={iconSize} className="-mt-[1px]" /> : null;
  } else {
    text = props.emptyStateText;
    icon = props.showIcon ? <IconLock size={iconSize} className="-mt-[1px]" /> : null;
  }

  return (
    <span className={elemClass}>
      <div className="flex items-center gap-1.5">
        {icon}
        <span>{text}</span>
      </div>
      {variant === "form-field" && !props.readonly && <IconChevronDown size={14} className="text-content-dimmed" />}
    </span>
  );
}

function getPrivacyIcon(level: PrivacyLevels, size: number) {
  return match(level)
    .with("public", () => <IconWorld size={size} className="-mt-[1px]" />)
    .with("internal", () => <IconBuilding size={size} className="-mt-[1px]" />)
    .with("confidential", () => <IconLock size={size} className="-mt-[1px]" />)
    .with("secret", () => <IconLockFilled size={size} className="-mt-[1px] text-content-error" />)
    .exhaustive();
}

function getPrivacyTitle(level: PrivacyLevels, spaceName: string) {
  return match(level)
    .with("public", () => "Public")
    .with("internal", () => "Everyone in the company")
    .with("confidential", () => `${spaceName} only`)
    .with("secret", () => "Invite-only")
    .exhaustive();
}

function getPrivacyDescription(level: PrivacyLevels, spaceName: string, resourceType: "goal" | "project") {
  return match(level)
    .with("public", () => `Anyone on the internet can view this ${resourceType}.`)
    .with("internal", () => `Anyone in your organization can view this ${resourceType}.`)
    .with("confidential", () => `Only members of the ${spaceName} space can view this ${resourceType}.`)
    .with("secret", () => `Only people explicitly invited can view this ${resourceType}.`)
    .exhaustive();
}

export namespace PrivacyField {
  export const PRIVACY_LEVELS = ["public", "internal", "confidential", "secret"] as const;
  export type PrivacyLevels = (typeof PRIVACY_LEVELS)[number];

  export interface Props {
    privacyLevel: PrivacyLevels | null;
    setPrivacyLevel?: (level: PrivacyLevels | null) => void;
    spaceName?: string;
    resourceType?: "goal" | "project";

    placeholder?: string;
    readonly?: boolean;
    className?: string;
    iconSize?: number;
    textSize?: string;

    showEmptyStateAsButton?: boolean;
    showIcon?: boolean;
    emptyStateText?: string;
    emptyStateReadonlyText?: string;

    variant?: "inline" | "form-field";
  }
}
