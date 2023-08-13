import React from "react";

import { useNavigate } from "react-router-dom";
import * as Groups from "@/graphql/Groups";
import * as Icons from "@tabler/icons-react";

import Avatar from "@/components/Avatar";

export default function MemberList({ group }: { group: Groups.Group }) {
  const navigate = useNavigate();
  const gotoGroupMembersPage = () => navigate(`/groups/${group.id}/members`);

  return (
    <div>
      <div
        className="inline-flex gap-2 items-center mb-4 cursor-pointer"
        onClick={gotoGroupMembersPage}
        data-test-id="group-members"
      >
        {group.members.map((m) => (
          <Avatar key={m.id} person={m} />
        ))}

        <div className="shrink-0 relative w-8 h-8 border-dashed border border-white-3 rounded-full p-0.5 text-white-3 flex items-center justify-center">
          <Icons.IconPlus size={16} />
        </div>
      </div>
    </div>
  );
}
