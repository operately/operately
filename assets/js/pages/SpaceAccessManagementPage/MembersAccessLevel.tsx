import React, { Dispatch, SetStateAction, useMemo, useState } from "react";

import { useRevalidator } from "react-router-dom";
import * as Icons from "@tabler/icons-react";
import { useLoadedData } from "./loader";
import { MemberContainer } from "./components";

import { Person } from "@/models/people";
import { useRemoveGroupMember } from "@/models/spaces";
import Avatar from "@/components/Avatar";
import { SelectBoxNoLabel } from "@/components/Form";
import { DropdownMenu } from "@/components/DropdownMenu";
import { PERMISSIONS_LIST, PermissionOption,  } from "@/features/Permissions";
import Button from "@/components/Button";


type SetMembers = Dispatch<SetStateAction<Person[]>>;


export function MembersAccessLevel() {
  const { space } = useLoadedData();
  const [members, setMembers] = useState(space.members ? [...space.members] : []);

  const hasChanged = useMemo(() => {
    return members.some((item, index) => item.accessLevel !== space.members![index]!.accessLevel);
  }, [members])

  return (
    <div className="flex flex-col gap-4">
      <div className="font-bold">Members</div>

      {members.map((member) => (
        <MemberListItem member={member} setMembers={setMembers} key={member.id} />
      ))}

      {hasChanged && (
        <Actions setMembers={setMembers} />
      )}
    </div>
  );
}


function Actions({ setMembers }: { setMembers: SetMembers }) {
  const { space } = useLoadedData();

  const resetMembers = () => {
    setMembers([...space.members!]);
  }

  return (
    <div className="flex gap-2">
      <Button
        variant="success"
        size="small"
      >
        Save
      </Button>
      <Button
        variant="secondary"
        size="small"
        onClick={resetMembers}
      >
        Cancel
      </Button>
    </div>
  );
}


function MemberListItem({ member, setMembers }: { member: Person; setMembers: SetMembers }) {
  const permissions = useMemo(() => {
    return PERMISSIONS_LIST.find((obj) => obj.value === member.accessLevel);
  }, [member])

  const handlePermissionsChange = (payload: PermissionOption) => {
    setMembers(members => members.map((obj) => {
      if(obj.id !== member.id) {
        return obj;
      }
      else {
        obj.accessLevel
        return {...obj, accessLevel: payload.value}
      }
    }))
  }

  return (
    <MemberContainer>
      <div className="flex items-center gap-2 pl-2 h-full border border-surface-outline rounded-lg">
        <Avatar person={member} size="tiny" />
        <p>{member.fullName} &middot; {member.title}</p>
      </div>
      <SelectBoxNoLabel onChange={handlePermissionsChange} options={PERMISSIONS_LIST} value={permissions} />
      <MemberDropdownAction member={member} />
    </MemberContainer>
  );
}

function MemberDropdownAction({ member }: { member: Person }) {
  const [open, setOpen] = useState(false);

  const { revalidate } = useRevalidator();
  const { space } = useLoadedData();
  const [remove] = useRemoveGroupMember();

  const handleRemove = async () => {
    remove({ groupId: space.id, memberId: member.id })
    .then(() => {
      revalidate();
    });
  };

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
