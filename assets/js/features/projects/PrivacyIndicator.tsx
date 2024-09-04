import * as React from "react";
import * as Icons from "@tabler/icons-react";
import * as Projects from "@/models/projects";

import { Tooltip } from "@/components/Tooltip";
import { match } from "ts-pattern";

interface PrivacyIndicatorProps {
  project: Projects.Project;
  size?: number;
}

const DEFAULT_SIZE = 24;

export function PrivacyIndicator({ project, size }: PrivacyIndicatorProps) {
  size = size ?? DEFAULT_SIZE;

  return match(project.privacy)
    .with(Projects.PRIVACY_PUBLIC, () => <PrivacyPublic size={size} />)
    .with(Projects.PRIVACY_INTERNAL, () => null)
    .with(Projects.PRIVACY_CONFIDENTIAL, () => <PrivacyConfidential project={project} size={size} />)
    .with(Projects.PRIVACY_SECRET, () => <PrivacySecret size={size} />)
    .otherwise(() => {
      throw new Error("Invalid privacy value");
    });
}

function PrivacyPublic({ size }: { size: number }) {
  const content = (
    <div>
      <div className="text-content-accent font-bold">Anyone on the internet</div>
      <div className="text-content-dimmed mt-1 w-64">
        This project is visible to anyone on the internet who has the link.
      </div>
    </div>
  );

  return (
    <Tooltip content={content} testId="public-project-tooltip" delayDuration={100}>
      <Icons.IconWorld size={size} />
    </Tooltip>
  );
}

function PrivacyConfidential({ project, size }: { project: Projects.Project; size: number }) {
  const content = (
    <div>
      <div className="text-content-accent font-bold">Only {project.space!.name} members</div>
      <div className="text-content-dimmed mt-1 w-64">
        This project is visible only to members of the {project.space!.name} space.
      </div>
    </div>
  );

  return (
    <Tooltip content={content} testId="confidential-project-tooltip" delayDuration={100}>
      <Icons.IconLockFilled size={size} />
    </Tooltip>
  );
}

function PrivacySecret({ size }) {
  const content = (
    <div>
      <div className="text-content-accent font-bold">Invite-Only</div>
      <div className="text-content-dimmed mt-1 w-64">Only people explicitly invited to this project can view it.</div>
    </div>
  );

  return (
    <Tooltip content={content} testId="secret-project-tooltip" delayDuration={100}>
      <Icons.IconLockFilled size={size} className="text-content-error" />
    </Tooltip>
  );
}
