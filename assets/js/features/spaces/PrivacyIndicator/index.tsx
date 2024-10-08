import * as React from "react";
import * as Icons from "@tabler/icons-react";
import * as Spaces from "@/models/spaces";

import { Tooltip } from "@/components/Tooltip";
import { assertPresent } from "@/utils/assertions";

interface PrivacyIndicatorProps {
  space: Spaces.Space;
  size?: number;
}

const DEFAULT_SIZE = 24;

export function PrivacyIndicator({ space, size }: PrivacyIndicatorProps) {
  size = size ?? DEFAULT_SIZE;

  assertPresent(space.accessLevels, "Space access levels must be defined");

  if (space.accessLevels.public! > 0) {
    return <PublicSpace size={size} />;
  }

  if (space.accessLevels.company! > 0) {
    return null;
  }

  return <InviteOnly size={size} />;
}

function PublicSpace({ size }: { size: number }) {
  const content = (
    <div>
      <div className="text-content-accent font-bold">Anyone on the internet</div>
      <div className="text-content-dimmed mt-1 w-64">
        This space is visible to anyone on the internet who has the link.
      </div>
    </div>
  );

  return (
    <Tooltip content={content} testId="public-project-tooltip" delayDuration={100}>
      <Icons.IconWorld size={size} />
    </Tooltip>
  );
}

function InviteOnly({ size }: { size: number }) {
  const content = (
    <div>
      <div className="text-content-accent font-bold">Invite-Only</div>
      <div className="text-content-dimmed mt-1 w-64">Only people explicitly invited to this space can view it.</div>
    </div>
  );

  return (
    <Tooltip content={content} testId="secret-space-tooltip" delayDuration={100}>
      <Icons.IconLockFilled size={size} />
    </Tooltip>
  );
}
