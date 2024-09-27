import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Spaces from "@/models/spaces";
import * as Pages from "@/components/Pages";

import Avatar from "@/components/Avatar";
import { SecondaryButton } from "@/components/Buttons";

import AddMembersModal from "./AddMembersModal";
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

  return (
    <Pages.Page title={space.name + " Members"}>
      <Paper.Root size="medium">
        <Paper.NavigateBack to={Paths.spacePath(space.id!)} title={`Back to ${space.name} Space`} />

        <Paper.Body minHeight="none">
          <Header space={space} />
          <AddMembersModal spaceId={space.id!} onSubmit={refetch} members={space.members} />
          <MemberList space={space} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
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
  const [remove] = Spaces.useRemoveGroupMember();

  const handleRemove = async () => {
    await remove({ groupId: space.id, memberId: member.id });

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
          <SecondaryButton size="xs" onClick={handleRemove} testId={"remove-member-" + member.id}>
            Remove
          </SecondaryButton>
        </div>
      </div>
    </div>
  );
}
