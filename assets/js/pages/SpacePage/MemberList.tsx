import * as Spaces from "@/models/spaces";
import * as React from "react";

import Avatar from "@/components/Avatar";
import { SecondaryButton } from "@/components/Buttons";
import { Paths } from "@/routes/paths";
import { useNavigate } from "react-router-dom";

export default function MemberList({ space }: { space: Spaces.Space }) {
  const navigate = useNavigate();

  const gotoSpaceMembersPage = () => navigate(Paths.spaceMembersPath(space.id!));
  const gotoSpaceAccessManagementPage = () => navigate(Paths.spaceAccessManagementPath(space.id!));

  if (space.members!.length === 0) return null;

  if (space.isCompanySpace) {
    return (
      <div>
        <div className="inline-flex gap-2 justify-center mb-4 flex-wrap mx-8" data-test-id="space-members">
          {space.members!.map((m) => (
            <Avatar key={m.id} person={m} size={32} />
          ))}
        </div>
      </div>
    );
  } else {
    return (
      <div className="flex items-center mt-2 gap-3">
        <div
          className="inline-flex gap-2 justify-end flex-wrap"
          onClick={gotoSpaceMembersPage}
          data-test-id="space-members"
        >
          {space.members!.map((m) => (
            <Avatar key={m.id} person={m} size={32} />
          ))}
        </div>
        <SecondaryButton onClick={gotoSpaceAccessManagementPage} size="xs" testId="access-management">
          Manage access
        </SecondaryButton>
      </div>
    );
  }
}
