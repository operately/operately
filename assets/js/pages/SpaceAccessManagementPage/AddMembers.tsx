import React, { useState } from "react";

import { Person, Space, searchPotentialSpaceMembers } from "@/api";
import { MemberContainer } from "./components";

import { PERMISSIONS_LIST, PermissionLevels, VIEW_ACCESS } from "@/features/Permissions";
import { SelectBoxNoLabel } from "@/components/Form";
import { GhostButton } from "@/components/Button";
import PeopleSearch from "@/components/PeopleSearch";



export function AddMembers({ space }: { space: Space }) {
  const [member, setMember] = useState<Person>();
  const [permissions, setPermissions] = useState(VIEW_ACCESS);

  const search = async (value: string) => {
    const result = await searchPotentialSpaceMembers({
      groupId: space.id,
      query: value,
      excludeIds: [],
      limit: 10,
    });

    const people = result.people!.map((person: Person) => (
      { ...person, permissions: PermissionLevels.COMMENT_ACCESS }
    ));

    people.sort((a, b) => a.fullName!.localeCompare(b.fullName!));

    return people;
  };



  return (
    <div className="flex flex-col gap-4">
      <div className="font-bold">Add Members</div>

      <MemberContainer>
        <PeopleSearch
          onChange={option => setMember(option?.person)}
          placeholder="Search for person..."
          loader={search}
        />

        {member && (
          <SelectBoxNoLabel onChange={setPermissions} options={PERMISSIONS_LIST} value={permissions} />
        )}
      </MemberContainer>

      <Button member={member} permissions={permissions} />
    </div>
  );
}

function Button({member, permissions}) {
  const handleAddMember = () => {
    permissions
    // Todo
  }

  if(!member) return <></>;

  return (
    <div className="w-[140px]">
      <GhostButton size="sm" onClick={handleAddMember}>Add member</GhostButton>
    </div>
  );
}
