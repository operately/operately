import React from "react";

import { useNavigate } from "react-router-dom";
import * as Groups from "@/graphql/Groups";

import Avatar from "@/components/Avatar";

export default function MemberList({ group }: { group: Groups.Group }) {
  const navigate = useNavigate();
  const gotoGroupMembersPage = () => navigate(`/spaces/${group.id}/members`);

  if (group.members!.length === 0) return null;

  if (group.isCompanySpace) {
    return (
      <div>
        <div className="inline-flex gap-2 justify-center mb-4 flex-wrap mx-8" data-test-id="group-members">
          {group.members!.map((m) => (
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
          onClick={gotoGroupMembersPage}
          data-test-id="group-members"
        >
          {group.members!.map((m) => (
            <Avatar key={m.id} person={m} size={32} />
          ))}
        </div>
      </div>
    );
  }
}
