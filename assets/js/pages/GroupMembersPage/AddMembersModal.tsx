import React, { useState } from "react";

import * as People from "@/models/people";
import * as Spaces from "@/models/spaces";
import * as Icons from "@tabler/icons-react";

import Modal from "@/components/Modal";
import Avatar from "@/components/Avatar";
import { FilledButton, GhostButton } from "@/components/Button";

import { Person } from "@/models/people";
import PeopleSearch, { Option } from "@/components/PeopleSearch";
import { PERMISSIONS_LIST, PermissionLevels } from "@/features/Permissions";
import { SelectBoxNoLabel } from "@/components/Form";

interface MemberOption extends Omit<Option, "person"> {
  person: Person & { permissions: PermissionLevels };
}

interface ContextDescriptor {
  selected: MemberOption[];
  add: (person: MemberOption) => void;
  remove: (id: string) => void;
}

const Context = React.createContext<ContextDescriptor | null>(null);

export default function AddMembersModal({ spaceId, onSubmit, members }) {
  const [selected, setSelectedList] = React.useState<MemberOption[]>([]);
  const [isModalOpen, setIsModalOpen]: [boolean, any] = React.useState(false);

  const add = (selection: MemberOption) => setSelectedList([...selected, selection]);
  const remove = (id: string) => {
    setSelectedList(selected.filter((p) => p.value !== id));
  };

  const search = async (value: string) => {
    let result = await Spaces.searchPotentialSpaceMembers({
      groupId: spaceId,
      query: value,
      excludeIds: selected.map((p) => p.value),
      limit: 10,
    });

    const people = result.people!.map((person: People.Person) => {
      return { ...person, permissions: PermissionLevels.COMMENT_ACCESS };
    });

    people.sort((a, b) => a.fullName!.localeCompare(b.fullName!));

    return people;
  };

  const [addMembers] = Spaces.useAddGroupMembers();

  const submit = async () => {
    await addMembers({
      groupId: spaceId,
      members: selected.map((s) => ({
        id: s.person.id,
        permissions: s.person.permissions,
      })),
    });

    setIsModalOpen(false);
    setSelectedList([]);
    onSubmit();
  };

  const openModal = () => setIsModalOpen(true);
  const hideModal = () => setIsModalOpen(false);

  return (
    <Context.Provider value={{ selected, add, remove }}>
      <div className="flex items-center my-8 gap-2">
        <div className="h-px bg-surface-outline flex-1" />
        <GhostButton type="primary" onClick={openModal} testId="add-space-members">
          Add Members
        </GhostButton>
        <div className="h-px bg-surface-outline flex-1" />
      </div>

      <Modal title="Add Members" isOpen={isModalOpen} hideModal={hideModal}>
        <SearchField
          onSelect={add}
          loader={search}
          placeholder={"Search for people..."}
          alreadySelected={selected.map((p) => p.value) + members.map((p: Person) => p.id)}
        />

        <div className="flex flex-col gap-2 mt-4">
          <PeopleList />
        </div>

        <div className="mt-4 flex">
          <FilledButton type="primary" onClick={submit} testId="submit-space-members">
            Add Members
          </FilledButton>
        </div>
      </Modal>
    </Context.Provider>
  );
}

function PeopleList() {
  const { selected } = React.useContext(Context) as ContextDescriptor;

  return (
    <div className="flex flex-col gap-2">
      {selected.map((s) => (
        <PeopleListItem selected={s} key={s.person.id} />
      ))}
    </div>
  );
}

function PeopleListItem({ selected }: { selected: MemberOption }): JSX.Element {
  const { person } = selected;
  const { remove } = React.useContext(Context) as ContextDescriptor;
  const [permissions, setPermissions] = useState(PERMISSIONS_LIST.find((obj) => obj.value === person.permissions));

  return (
    <div className="grid grid-cols-[60%_32%_1fr] gap-2 w-full">
      <div className="flex items-center gap-2 pl-2 border border-surface-outline rounded-lg">
        <Avatar person={person} size="tiny" />
        <p>
          {person.fullName} &middot; {person.title}
        </p>
      </div>
      <SelectBoxNoLabel onChange={setPermissions} options={PERMISSIONS_LIST} value={permissions} />
      <RemoveIcon onClick={() => remove(selected.value)} />
    </div>
  );
}

function SearchField({ onSelect, loader, placeholder, alreadySelected }) {
  const [selected, setSelected] = React.useState(null);

  const onChange = (value: any) => {
    onSelect(value);
    setSelected(null);
  };

  const filterOptions = (candidate: any): boolean => {
    return !alreadySelected.includes(candidate.value);
  };

  return (
    <PeopleSearch
      placeholder={placeholder}
      value={selected}
      onChange={onChange}
      loader={loader}
      filterOption={filterOptions}
    />
  );
}

function RemoveIcon({ onClick }) {
  return (
    <div
      className="flex items-center justify-center text-content-dimmed hover:cursor-pointer hover:text-content-accent"
      onClick={onClick}
    >
      <Icons.IconX size={20} />
    </div>
  );
}
