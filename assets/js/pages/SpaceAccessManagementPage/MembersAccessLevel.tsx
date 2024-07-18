import React, { useState } from "react";

import * as Icons from "@tabler/icons-react";
import { useLoadedData } from "./loader";
import { MemberContainer } from "./components";

import { Person } from "@/api";
import Avatar from "@/components/Avatar";
import { SelectBoxNoLabel } from "@/components/Form";
import { DropdownMenu } from "@/components/DropdownMenu";
import { PERMISSIONS_LIST } from "@/features/Permissions";


export function MembersAccessLevel() {
  const { space } = useLoadedData();

  return (
    <div className="flex flex-col gap-4">
      <div className="font-bold">Members</div>

      {space.members?.map((member) => (
        <MemberListItem member={member} key={member.id} />
      ))}
    </div>
  );
}

function MemberListItem({ member }: { member: Person }) {
  const [permissions, setPermissions] = useState(PERMISSIONS_LIST.find((obj) => obj.value === member.accessLevel));

  return (
    <MemberContainer>
      <div className="flex items-center gap-2 pl-2 h-full border border-surface-outline rounded-lg">
        <Avatar person={member} size="tiny" />
        <p>{member.fullName} &middot; {member.title}</p>
      </div>
      <SelectBoxNoLabel onChange={setPermissions} options={PERMISSIONS_LIST} value={permissions} />
      <MemberDropdownAction member={member} />
    </MemberContainer>
  );
}

function MemberDropdownAction({ member }: { member: Person }) {
  const [open, setOpen] = useState(false);

  const handleRemove = () => {
    // TODO
  }

  return (
    <DropdownMenu
        testId={"remove-" + member.id}
        open={open}
        setOpen={setOpen}
        trigger={<Icons.IconDots size={14} className="cursor-pointer" />}
        options={[
          <DropdownOption title="Remove member" onClick={handleRemove} key="remeve-member-option" />
        ]}
      />
  );
}

function DropdownOption({ title, onClick, testId }: { title: string; onClick: () => void; testId?: string }) {
  return (
    <div
      data-test-id={testId}
      onClick={onClick}
      className="hover:bg-accent-1 hover:text-white-1 rounded-md px-1.5 py-0.5 text-sm cursor-pointer"
    >
      {title}
    </div>
  );
}
