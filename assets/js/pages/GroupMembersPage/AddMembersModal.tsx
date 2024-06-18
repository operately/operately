import React from "react";

import Modal from "@/components/Modal";
import Avatar from "@/components/Avatar";
import { FilledButton, GhostButton } from "@/components/Button";

import { Person } from "@/models/people";
import PeopleSearch, { Option } from "@/components/PeopleSearch";
import * as Spaces from "@/models/spaces";
import client from "@/graphql/client";
import * as Icons from "@tabler/icons-react";

interface ContextDescriptor {
  selected: Option[];
  add: (person: Option) => void;
  remove: (id: string) => void;
}

const Context = React.createContext<ContextDescriptor | null>(null);

export default function AddMembersModal({ spaceId, onSubmit, members }) {
  const [selected, setSelectedList] = React.useState<Option[]>([]);
  const [isModalOpen, setIsModalOpen]: [boolean, any] = React.useState(false);

  const add = (selection: Option) => setSelectedList([...selected, selection]);
  const remove = (id: string) => {
    setSelectedList(selected.filter((p) => p.value !== id));
  };

  const search = async (value: string) => {
    let result = await Spaces.listPotentialSpaceMembers(client, {
      variables: {
        groupId: spaceId,
        query: value,
        excludeIds: selected.map((p) => p.value),
        limit: 10,
      },
    });

    let people = [...result.data.potentialGroupMembers].sort((a, b) => a.fullName.localeCompare(b.fullName));
    return people;
  };

  const submit = async () => {
    await client.mutate({
      mutation: Spaces.ADD_MEMBERS,
      variables: {
        groupId: spaceId,
        personIds: selected.map((s) => s.person.id),
      },
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
        <PeopleListItem selected={s} />
      ))}
    </div>
  );
}

function PeopleListItem({ selected }: { selected: Option }): JSX.Element {
  const { remove } = React.useContext(Context) as ContextDescriptor;

  return (
    <div className="px-2 py-1 bg-surface rounded flex justify-between items-center" key={selected.value}>
      <div className="flex items-center gap-2">
        <Avatar person={selected.person} size="tiny" />
        <p>
          {selected.person.fullName} &middot; {selected.person.title}
        </p>
      </div>

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
    <div className="hover:cursor-pointer text-content-dimmed hover:text-content-accent" onClick={onClick}>
      <Icons.IconX size={20} />
    </div>
  );
}
