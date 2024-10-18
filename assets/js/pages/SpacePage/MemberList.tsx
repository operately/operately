import * as Spaces from "@/models/spaces";
import * as React from "react";

import Avatar from "@/components/Avatar";
import { SecondaryButton } from "@/components/Buttons";
import { Paths } from "@/routes/paths";
import { assertPresent } from "@/utils/assertions";

export default function MemberList({ space }: { space: Spaces.Space }) {
  return (
    <div className="flex items-center mt-2 gap-3">
      <div className="inline-flex gap-2 justify-end flex-wrap" data-test-id="space-members">
        {space.members!.map((m) => (
          <Avatar key={m.id} person={m} size={32} />
        ))}
      </div>

      <ManageAccessButton space={space} />
    </div>
  );
}

function ManageAccessButton({ space }: { space: Spaces.Space }) {
  const path = Paths.spaceAccessManagementPath(space.id!);

  assertPresent(space.permissions, "permissions must be present in space");
  if (!space.permissions.canAddMembers) return null;

  return (
    <SecondaryButton linkTo={path} size="xs" testId="access-management">
      Manage access
    </SecondaryButton>
  );
}
