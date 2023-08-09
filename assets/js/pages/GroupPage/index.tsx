import React from "react";

import { useDocumentTitle } from "@/layouts/header";
import { useNavigate } from "react-router-dom";

import * as Paper from "@/components/PaperContainer";
import * as Groups from "@/graphql/Groups";
import * as Icons from "@tabler/icons-react";

import Avatar from "@/components/Avatar";

import client from "@/graphql/client";

interface LoadedData {
  group: Groups.Group;
}

export async function loader({ params }): Promise<LoadedData> {
  const groupData = await client.query({
    query: Groups.GET_GROUP,
    variables: { id: params.id },
  });

  return { group: groupData.data.group };
}

export function Page() {
  const [{ group }] = Paper.useLoadedData() as [LoadedData, () => void];

  useDocumentTitle(group.name);

  return (
    <Paper.Root>
      <Paper.Navigation>
        <Paper.NavItem linkTo={`/groups`}>
          <Icons.IconUsers size={16} stroke={3} />
          Groups
        </Paper.NavItem>
      </Paper.Navigation>

      <Paper.Body>
        <div className="mb-4">
          <h1 className="font-extrabold text-2xl">{group.name}</h1>
          <div>{group.mission}</div>
        </div>

        <MemberList group={group} />
      </Paper.Body>
    </Paper.Root>
  );
}

function MemberList({ group }: { group: Groups.Group }) {
  const navigate = useNavigate();
  const gotoGroupMembersPage = () => navigate(`/groups/${group.id}/members`);

  return (
    <div
      className="flex gap-2 items-center mb-4 cursor-pointer"
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
  );
}

// <PointsOfContact
//   groupId={id}
//   groupName={data.group.name}
//   pointsOfContact={data.group.pointsOfContact}
//   onAddContact={refetch}
// />

// <Projects groupId={id} />
// <Objectives groupId={id} />
