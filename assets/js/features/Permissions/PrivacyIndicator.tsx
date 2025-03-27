import * as React from "react";
import * as Icons from "@tabler/icons-react";

import { Project } from "@/models/projects";
import { Goal } from "@/models/goals";
import { Space } from "@/models/spaces";

import { PermissionOptions } from ".";

import { Tooltip } from "@/components/Tooltip";
import { match } from "ts-pattern";
import { assertPresent } from "@/utils/assertions";

interface ProjectProps {
  project: Project;
}

interface GoalProps {
  goal: Goal;
}

type Props = (ProjectProps | GoalProps) & {
  size?: number;
};

const DEFAULT_SIZE = 24;

export function PrivacyIndicator(props: Props) {
  const resource = "goal" in props ? props.goal : props.project;
  const type = "goal" in props ? "goal" : "project";
  const size = props.size ?? DEFAULT_SIZE;

  return match(resource.privacy)
    .with(PermissionOptions.PUBLIC, () => <PrivacyPublic size={size} type={type} />)
    .with(PermissionOptions.INTERNAL, () => null)
    .with(PermissionOptions.CONFIDENTIAL, () => {
      assertPresent(resource.space, `${type} must include space`);
      return <PrivacyConfidential space={resource.space} size={size} type={type} />;
    })
    .with(PermissionOptions.SECRET, () => <PrivacySecret size={size} type={type} />)
    .otherwise(() => {
      throw new Error("Invalid privacy value");
    });
}

interface PrivacyProps {
  size: number;
  type: "project" | "goal";
}

function PrivacyPublic({ size, type }: PrivacyProps) {
  const content = (
    <div>
      <div className="text-content-accent font-bold">Anyone on the internet</div>
      <div className="text-content-dimmed mt-1 w-64">
        This {type} is visible to anyone on the internet who has the link.
      </div>
    </div>
  );

  return (
    <Tooltip content={content} testId="public-project-tooltip" delayDuration={100}>
      <Icons.IconWorld size={size} />
    </Tooltip>
  );
}

function PrivacyConfidential({ space, size, type }: PrivacyProps & { space: Space }) {
  const content = (
    <div>
      <div className="text-content-accent font-bold">Only {space.name} members</div>
      <div className="text-content-dimmed mt-1 w-64">
        This {type} is visible only to members of the {space.name} space.
      </div>
    </div>
  );

  return (
    <Tooltip content={content} testId="confidential-project-tooltip" delayDuration={100}>
      <Icons.IconLockFilled size={size} />
    </Tooltip>
  );
}

function PrivacySecret({ size, type }: PrivacyProps) {
  const content = (
    <div>
      <div className="text-content-accent font-bold">Invite-Only</div>
      <div className="text-content-dimmed mt-1 w-64">Only people explicitly invited to this {type} can view it.</div>
    </div>
  );

  return (
    <Tooltip content={content} testId="secret-project-tooltip" delayDuration={100}>
      <Icons.IconLockFilled size={size} className="text-content-error" />
    </Tooltip>
  );
}
