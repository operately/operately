import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Spaces from "@/models/spaces";

import { useRevalidator } from "react-router-dom";

import { Person } from "@/models/people";
import { Space, searchPotentialSpaceMembers, useAddGroupMembers } from "@/models/spaces";

import { PERMISSIONS_LIST, PermissionLevels, VIEW_ACCESS } from "@/features/Permissions";
import { SelectBoxNoLabel } from "@/components/Form";
import { PrimaryButton } from "@/components/Buttons";
import PeopleSearch from "@/components/PeopleSearch";

interface LoaderResult {
  space: Spaces.Space;
}

export async function loader({ params }): Promise<LoaderResult> {
  const space = await Spaces.getSpace({
    id: params.id,
    includeMembersAccessLevels: true,
    includeAccessLevels: true,
    includePotentialSubscribers: true,
  });

  return { space: space };
}

export function Page() {
  const { space } = Pages.useLoadedData<LoaderResult>();

  return (
    <Pages.Page title={["Add Members", space.name!]}>
      <Paper.Root>
        <Paper.Body>
          <Title />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Title() {
  return <div className="text-content-accent text-3xl font-extrabold">SpaceAddMembersPage</div>;
}

export function AddMembers({ space }: { space: Space }) {
  const [peopleSearchKey, setPeopleSearchKey] = useState(0);
  const [member, setMember] = useState<Person>();
  const [permissions, setPermissions] = useState(VIEW_ACCESS);

  const { revalidate } = useRevalidator();
  const [addMembers, { loading }] = useAddGroupMembers();

  const search = async (value: string) => {
    const result = await searchPotentialSpaceMembers({
      groupId: space.id,
      query: value,
      excludeIds: [],
      limit: 10,
    });

    const people = result.people!.map((person: Person) => ({
      ...person,
      permissions: PermissionLevels.COMMENT_ACCESS,
    }));

    people.sort((a, b) => a.fullName!.localeCompare(b.fullName!));

    return people;
  };

  const handleAddMember = () => {
    if (!member) return;

    addMembers({
      groupId: space.id,
      members: [
        {
          id: member.id,
          permissions: permissions.value,
        },
      ],
    }).then(() => {
      revalidate();
      setMember(undefined);
      setPeopleSearchKey((prev) => prev + 1);
    });
  };

  return (
    <Paper.Section title="Add Members">
      <div className="flex flex-col gap-4">
        <MemberContainer>
          <PeopleSearch
            onChange={(option) => setMember(option?.person)}
            placeholder="Search for person..."
            loader={search}
            key={peopleSearchKey}
          />

          {member && <SelectBoxNoLabel onChange={setPermissions} options={PERMISSIONS_LIST} value={permissions} />}
        </MemberContainer>

        <AddMemberButton member={member} loading={loading} handleAddMember={handleAddMember} />
      </div>
    </Paper.Section>
  );
}

function AddMemberButton({ member, loading, handleAddMember }) {
  if (!member) return <></>;

  return (
    <div>
      <PrimaryButton loading={loading} size="xs" onClick={handleAddMember} testId="submit-space-members">
        Add member
      </PrimaryButton>
    </div>
  );
}
