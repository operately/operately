import React from "react";

import { useDocumentTitle } from "@/layouts/header";

import * as Paper from "@/components/PaperContainer";
import * as Groups from "@/graphql/Groups";
import * as Icons from "@tabler/icons-react";

import Avatar from "@/components/Avatar";
import Button from "@/components/Button";

import client from "@/graphql/client";

interface LoadedData {
  group: Groups.Group;
}

export async function loader({ params }): Promise<LoadedData> {
  const groupData = await client.query({
    query: Groups.GET_GROUP,
    variables: { id: params.id },
    fetchPolicy: "network-only",
  });

  return { group: groupData.data.group };
}

export function Page() {
  const [{ group }] = Paper.useLoadedData() as [LoadedData, () => void];

  useDocumentTitle(group.name + " Members");

  return (
    <Paper.Root>
      <Paper.Navigation>
        <Paper.NavItem linkTo={`/groups/${group.id}`}>
          <Icons.IconUsers size={16} stroke={3} />
          {group.name}
        </Paper.NavItem>
      </Paper.Navigation>

      <Paper.Body>
        <Header group={group} />

        <MemberList group={group} />
      </Paper.Body>
    </Paper.Root>
  );
}

function Header({ group }: { group: Groups.Group }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="font-extrabold text-2xl">Group Members</div>
      <Button variant="success">Add Member</Button>
    </div>
  );
}

function MemberList({ group }: { group: Groups.Group }) {
  return (
    <div className="flex flex-col divide-y divide-shade-2 mt-8">
      {group.members.map((member) => (
        <MemberListItem key={member.id} member={member} />
      ))}
    </div>
  );
}

function MemberListItem({ member }) {
  const [{ group }, refetch] = Paper.useLoadedData() as [LoadedData, () => void];
  const [remove, { loading }] = Groups.useRemoveMemberFromGroup();

  const handleRemove = async () => {
    await remove({ variables: { groupId: group.id, memberId: member.id } });

    refetch();
  };

  return (
    <div className="flex justify-between items-center py-4">
      <div className="flex items-center gap-3">
        <Avatar person={member} size="large" />
        <div>
          <div className="font-bold">{member.fullName}</div>
          <div className="text-sm text-white-1/80">{member.title}</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="small"
          onClick={handleRemove}
          loading={loading}
          data-test-id={"remove-member-" + member.id}
        >
          Remove
        </Button>
      </div>
    </div>
  );
}
