import * as React from "react";
import * as Spaces from "@/models/spaces";

import { useNavigate } from "react-router-dom";
import Avatar from "@/components/Avatar";

export default function MemberList({ space }: { space: Spaces.Space }) {
  const navigate = useNavigate();
  const gotoSpaceMembersPage = () => navigate(`/spaces/${space.id}/members`);

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
      <div>
        <div
          className="inline-flex gap-2 justify-center mb-4 flex-wrap mx-8"
          onClick={gotoSpaceMembersPage}
          data-test-id="space-members"
        >
          {space.members!.map((m) => (
            <Avatar key={m.id} person={m} size={32} />
          ))}
        </div>
      </div>
    );
  }
}
