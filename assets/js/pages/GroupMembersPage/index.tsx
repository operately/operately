import React from "react";

import { useDocumentTitle } from "@/layouts/header";

import * as Paper from "@/components/PaperContainer";
import * as Icons from "@tabler/icons-react";
import * as Spaces from "@/models/spaces";

import Avatar from "@/components/Avatar";
import { GhostButton } from "@/components/Button";

import AddMembersModal from "./AddMembersModal";
import { Link } from "@/components/Link";
import { Paths } from "@/routes/paths";

interface LoadedData {
  space: Spaces.Space;
}

export async function loader({ params }): Promise<LoadedData> {
  return { space: await Spaces.getSpace({ id: params.id, includeMembers: true }) };
}

export function Page() {
  const [{ space }] = Paper.useLoadedData() as [LoadedData, () => void];
  const [_, refetch] = Paper.useLoadedData() as [LoadedData, () => void];

  useDocumentTitle(space.name + " Members");

  return (
    <Paper.Root size="medium">
      <div className="flex items-center justify-center mb-2">
        <Link to={Paths.spacePath(space.id!)}>
          <Icons.IconArrowLeft className="text-content-dimmed inline mr-2" size={16} />
          Back to the {space.name} Space
        </Link>
      </div>

      <Paper.Body minHeight="none">
        <Header space={space} />
        <AddMembersModal spaceId={space.id!} onSubmit={refetch} members={space.members} />
        <MemberList space={space} />
      </Paper.Body>
    </Paper.Root>
  );
}

function Header({ space }) {
  return <div className="font-extrabold text-2xl text-center">Members of {space.name}</div>;
}

function MemberList({ space }: { space: Spaces.Space }) {
  return (
    <div className="grid grid-cols-3 gap-4 mt-8">
      {space.members!.map((member) => (
        <MemberListItem key={member.id} member={member} />
      ))}
    </div>
  );
}

function MemberListItem({ member }) {
  const [{ space }, refetch] = Paper.useLoadedData() as [LoadedData, () => void];
  const [remove] = Spaces.useRemoveMemberFromSpace();

  const handleRemove = async () => {
    await remove({ variables: { groupId: space.id, memberId: member.id } });

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
