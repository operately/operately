import * as Popover from "@radix-ui/react-popover";
import * as React from "react";

import classNames from "../utils/classnames";

import { IconBuilding, IconLock, IconLockFilled, IconTent } from "@tabler/icons-react";
import { match } from "ts-pattern";
import { PrimaryButton, SecondaryButton } from "../Button";

export const PRIVACY_LEVELS = ["internal", "confidential", "secret"] as const;

export namespace PrivacyField {
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
  }
}

export function PrivacyField({
  privacyLevel,
  setPrivacyLevel = () => {},
  spaceName = "Team",
  resourceType = "project",
  readonly = false,
  iconSize = 18,
  textSize = "text-sm",
  className = "",
  showIcon = true,
  emptyStateText = "Set privacy",
  emptyStateReadonlyText = "No privacy set",
}: PrivacyField.Props) {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleChange = (newLevel: PrivacyField.PrivacyLevels | null) => {
    if (newLevel === null) {
      // If null is passed, it means cancel was clicked
      setIsOpen(false);
    } else if (privacyLevel !== newLevel) {
      setPrivacyLevel(newLevel);
      setIsOpen(false); // Close popover after privacy selection
    } else {
      setIsOpen(false); // Close anyway if no change
    }
  };

  const triggerClassName = classNames(
    "inline-block focus:outline-none",
    {
      "hover:bg-surface-dimmed rounded-lg px-1.5 py-1 -mx-1.5 -my-1": !readonly,
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
        />
      </Popover.Trigger>
      <Popover.Portal>
        <PrivacyPickerPopover privacyLevel={privacyLevel} setNewPrivacyLevel={handleChange} />
      </Popover.Portal>
    </Popover.Root>
  );
}

const PrivacyPickerPopover = React.forwardRef<
  HTMLDivElement,
  {
    privacyLevel?: PrivacyField.PrivacyLevels | null;
    setNewPrivacyLevel: (level: PrivacyField.PrivacyLevels | null) => void;
  }
>(({ privacyLevel, setNewPrivacyLevel }, ref) => {
  const [tempPrivacyLevel, setTempPrivacyLevel] = React.useState<PrivacyField.PrivacyLevels | null>(
    privacyLevel || null,
  );

  // Reset temp value when popover opens (in case previous edits were cancelled)
  React.useEffect(() => {
    setTempPrivacyLevel(privacyLevel || null);
  }, [privacyLevel]);

  const handleSave = () => {
    setNewPrivacyLevel(tempPrivacyLevel);
    // Close popover is handled by the parent component
  };

  return (
    <Popover.Content
      ref={ref}
      className="bg-surface-base shadow-lg border border-surface-outline rounded-md z-50 w-80"
      sideOffset={5}
    >
      <div className="p-4">
        <div className="mb-3">
          <div className="text-sm font-medium">Privacy Settings</div>
        </div>

        <AccessLevelOptions privacyLevel={tempPrivacyLevel} setNewPrivacyLevel={setTempPrivacyLevel} />

        <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-surface-outline">
          <SecondaryButton size="sm" onClick={() => setNewPrivacyLevel(null)}>
            Cancel
          </SecondaryButton>
          <PrimaryButton size="sm" onClick={handleSave}>
            Save
          </PrimaryButton>
        </div>
      </div>

      <Popover.Arrow />
    </Popover.Content>
  );
});

interface PrivacyDisplayProps {
  privacyLevel: PrivacyField.PrivacyLevels | null | undefined;
  spaceName: string;
  resourceType: "goal" | "project";
  className: string;
  readonly: boolean;

  iconSize: number;
  textSize: string;
  showIcon: boolean;

  emptyStateText: string;
  emptyStateReadonlyText: string;
}

function PrivacyDisplay(props: PrivacyDisplayProps) {
  const iconSize = props.iconSize;
  const textSize = props.textSize;

  const elemClass = classNames(
    {
      "flex items-center": true,
      "gap-1.5": props.showIcon,
      "text-content-dimmed": !props.privacyLevel,
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
    </span>
  );
}

function getPrivacyIcon(level: PrivacyField.PrivacyLevels, size: number) {
  return match(level)
    .with("internal", () => <IconBuilding size={size} className="-mt-[1px]" />)
    .with("confidential", () => <IconLock size={size} className="-mt-[1px]" />)
    .with("secret", () => <IconLockFilled size={size} className="-mt-[1px] text-content-error" />)
    .exhaustive();
}

function getPrivacyTitle(level: PrivacyField.PrivacyLevels, spaceName: string) {
  return match(level)
    .with("internal", () => "Everyone in the company")
    .with("confidential", () => `${spaceName} only`)
    .with("secret", () => "Invite-only")
    .exhaustive();
}

interface AccessLevelOptionsProps {
  privacyLevel: PrivacyField.PrivacyLevels | null | undefined;
  setNewPrivacyLevel: (level: PrivacyField.PrivacyLevels | null) => void;
}

function AccessLevelOptions({ privacyLevel, setNewPrivacyLevel }: AccessLevelOptionsProps) {
  // Create mapping from privacy levels to access levels
  const companyAccessMapping = {
    internal: "View Access",
    confidential: "No Access",
    secret: "No Access",
  };

  const spaceAccessMapping = {
    internal: "View Access",
    confidential: "View Access",
    secret: "No Access",
  };

  // Get the current access levels based on privacyLevel
  const companyAccess = privacyLevel ? companyAccessMapping[privacyLevel] : "View Access"; // Default to internal view
  const spaceAccess = privacyLevel ? spaceAccessMapping[privacyLevel] : "View Access"; // Default to internal view

  // Function to map from access selections back to a privacy level
  const handleAccessChange = (accessType: string, newValue: string) => {
    let newPrivacyLevel = privacyLevel || "internal";

    if (accessType === "company") {
      if (newValue === "View Access") {
        newPrivacyLevel = "internal";
      } else if (newValue === "No Access") {
        // If company has no access, it's confidential or secret
        newPrivacyLevel = "confidential";
      }
    } else if (accessType === "space") {
      if (newValue === "No Access") {
        // If space has no access, it's secret
        newPrivacyLevel = "secret";
      } else if (companyAccess === "No Access" && newValue === "View Access") {
        // If space has access but company doesn't, it's confidential
        newPrivacyLevel = "confidential";
      }
    }

    setNewPrivacyLevel(newPrivacyLevel);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <IconBuilding size={18} className="-mt-[1px]" />
          <label className="text-sm">Company Members</label>
        </div>

        <select
          className="w-full pl-2 pr-4 py-1.5 border border-surface-outline rounded-md text-sm bg-surface-base"
          value={companyAccess}
          onChange={(e) => handleAccessChange("company", e.target.value)}
        >
          <option value="No Access">No Access</option>
          <option value="View Access">View Access</option>
          <option value="Comment Access">Comment Access</option>
          <option value="Edit Access">Edit Access</option>
        </select>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <IconTent size={18} className="-mt-[1px]" />
          <label className="text-sm">Space Members</label>
        </div>
        <select
          className="w-full px-2 py-1.5 border border-surface-outline rounded-md text-sm bg-surface-base"
          value={spaceAccess}
          onChange={(e) => handleAccessChange("space", e.target.value)}
        >
          <option value="No Access">No Access</option>
          <option value="View Access">View Access</option>
          <option value="Comment Access">Comment Access</option>
          <option value="Edit Access">Edit Access</option>
          <option value="Full Access">Full Access</option>
        </select>
      </div>
    </div>
  );
}
