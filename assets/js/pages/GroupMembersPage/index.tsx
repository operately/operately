import React from "react";

import { useDocumentTitle } from "@/layouts/header";

import * as Paper from "@/components/PaperContainer";
import * as Groups from "@/graphql/Groups";
import * as Icons from "@tabler/icons-react";

import Avatar from "@/components/Avatar";
import { GhostButton } from "@/components/Button";

import AddMembersModal from "./AddMembersModal";
import { Link } from "@/components/Link";

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
  const [_, refetch] = Paper.useLoadedData() as [LoadedData, () => void];

  useDocumentTitle(group.name + " Members");

  return (
    <Paper.Root size="medium">
      <div className="flex items-center justify-center mb-2">
        <Link to={`/spaces/${group.id}`}>
          <Icons.IconArrowLeft className="text-content-dimmed inline mr-2" size={16} />
          Back to the {group.name} Space
        </Link>
      </div>

      <Paper.Body minHeight="none">
        <Header group={group} />
        <AddMembersModal groupId={group.id} onSubmit={refetch} members={group.members} />
        <MemberList group={group} />
      </Paper.Body>
    </Paper.Root>
  );
}

function Header({ group }) {
  return <div className="font-extrabold text-2xl text-center">Members of {group.name}</div>;
}

function MemberList({ group }: { group: Groups.Group }) {
  return (
    <div className="grid grid-cols-3 gap-4 mt-8">
      {group.members!.map((member) => (
        <MemberListItem key={member.id} member={member} />
      ))}
    </div>
  );
}

function MemberListItem({ member }) {
  const [{ group }, refetch] = Paper.useLoadedData() as [LoadedData, () => void];
  const [remove] = Groups.useRemoveMemberFromGroup();

  const handleRemove = async () => {
    await remove({ variables: { groupId: group.id, memberId: member.id } });

    refetch();
  };

  return (
    <div className="p-4 rounded border border-surface-outline">
      <div className="flex flex-col gap-2">
        <div className="flex-1 flex flex-col items-center text-center">
          <div className="my-4">
            <Avatar person={member} size="xlarge" />
          </div>

          <div>
            <div className="font-bold">{member.fullName}</div>
            <div className="text-sm text-content-dimmed">{member.title}</div>
          </div>
        </div>

        <div className="flex justify-center">
          <GhostButton type="secondary" size="xs" onClick={handleRemove} testId={"remove-member-" + member.id}>
            Remove
          </GhostButton>
        </div>
      </div>
    </div>
  );
}
