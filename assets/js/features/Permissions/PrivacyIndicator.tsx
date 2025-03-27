import * as React from "react";
import * as Icons from "@tabler/icons-react";

import { Project } from "@/models/projects";
import { Goal } from "@/models/goals";
import { Space } from "@/models/spaces";

import { PermissionOptions } from ".";

import { Tooltip } from "@/components/Tooltip";
import { match } from "ts-pattern";
import { assertPresent } from "@/utils/assertions";

interface Props {
  resource: Project | Goal;
  type: "goal" | "project";
  size?: number;
  disabled?: boolean;
}

const DEFAULT_SIZE = 24;

export function PrivacyIndicator({ resource, type, disabled, size = DEFAULT_SIZE }: Props) {
  assertPresent(resource.space, `${type} must include space`);
  const props = { type, disabled, size };

  return match(resource.privacy)
    .with(PermissionOptions.PUBLIC, () => <PrivacyPublic {...props} />)
    .with(PermissionOptions.INTERNAL, () => (type === "goal" ? <PrivacyInternal {...props} /> : null))
    .with(PermissionOptions.CONFIDENTIAL, () => <PrivacyConfidential space={resource.space!} {...props} />)
    .with(PermissionOptions.SECRET, () => <PrivacySecret {...props} />)
    .otherwise(() => {
      throw new Error("Invalid privacy value");
    });
}

interface PrivacyProps {
  size: number;
  type: "project" | "goal";
  disabled?: boolean;
}

function PrivacyPublic({ size, type, disabled }: PrivacyProps) {
  const content = (
    <div>
      <div className="text-content-accent font-bold">Anyone on the internet</div>
      <div className="text-content-dimmed mt-1 w-64">
        This {type} is visible to anyone on the internet who has the link.
      </div>
    </div>
  );

  return (
    <Tooltip content={content} testId="public-project-tooltip" delayDuration={100} disabled={disabled}>
      <Icons.IconWorld size={size} />
    </Tooltip>
  );
}

function PrivacyInternal({ size, type, disabled }: PrivacyProps) {
  const content = (
    <div>
      <div className="text-content-accent font-bold">Company members</div>
      <div className="text-content-dimmed mt-1 w-64">This {type} is visible to all company members.</div>
    </div>
  );

  return (
    <Tooltip content={content} testId="internal-project-tooltip" delayDuration={100} disabled={disabled}>
      <Icons.IconLockFilled size={size} />
    </Tooltip>
  );
}

function PrivacyConfidential({ space, size, type, disabled }: PrivacyProps & { space: Space }) {
  const content = (
    <div>
      <div className="text-content-accent font-bold">Only {space.name} members</div>
      <div className="text-content-dimmed mt-1 w-64">
        This {type} is visible only to members of the {space.name} space.
      </div>
    </div>
  );

  return (
    <Tooltip content={content} testId="confidential-project-tooltip" delayDuration={100} disabled={disabled}>
      <Icons.IconLockFilled size={size} />
    </Tooltip>
  );
}

function PrivacySecret({ size, type, disabled }: PrivacyProps) {
  const content = (
    <div>
      <div className="text-content-accent font-bold">Invite-Only</div>
      <div className="text-content-dimmed mt-1 w-64">Only people explicitly invited to this {type} can view it.</div>
    </div>
  );

  return (
    <Tooltip content={content} testId="secret-project-tooltip" delayDuration={100} disabled={disabled}>
      <Icons.IconLockFilled size={size} className="text-content-error" />
    </Tooltip>
  );
}
