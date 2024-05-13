import React from "react";

import Modal from "@/components/Modal";
import Avatar from "@/components/Avatar";
import { GhostButton } from "@/components/Button";

import { Person } from "@/models/people";
import PeopleSearch, { Option } from "@/components/PeopleSearch";
import * as Icons from "@tabler/icons-react";
import { FormState } from "./useForm";
import * as People from "@/models/people";

export function AddAdminsModal({ form }: { form: FormState }) {
  const state = useAddAdminsModalState(form);

  return (
    <>
      <div className="flex items-center my-8 gap-2">
        <div className="h-px bg-surface-outline flex-1" />
        <GhostButton type="primary" onClick={state.openModal} testId="add-admins">
          Add Admininstrators
        </GhostButton>
        <div className="h-px bg-surface-outline flex-1" />
      </div>

      <Modal title="Add administrators" isOpen={state.isModalOpen} hideModal={state.hideModal}>
        <SearchField
          onSelect={state.add}
          loader={state.search}
          placeholder={"Search for people to promote to admin"}
          alreadySelected={state.excludeIds}
        />

        <div className="flex flex-col gap-2 mt-4">
          <PeopleList state={state} />
        </div>

        <div className="mt-4 flex items-center justify-center">
          <GhostButton onClick={state.submit} testId="save-admins">
            Add Admininstrators
          </GhostButton>
        </div>
      </Modal>
    </>
  );
}

function PeopleList({ state }: { state: AdminModalState }) {
  return (
    <div className="flex flex-col gap-2">
      {state.selected.map((s) => (
        <PeopleListItem key={s.value} selected={s} state={state} />
      ))}
    </div>
  );
}

function PeopleListItem({ selected, state }) {
  return (
    <div
      className="px-2 py-2 bg-surface-dimmed border border-surface-outline rounded flex justify-between items-center"
      key={selected.value}
    >
      <div className="flex items-center gap-2">
        <Avatar person={selected.person} size="tiny" />
        <p>
          {selected.person.fullName} &middot; {selected.person.title}
        </p>
      </div>

      <RemoveIcon onClick={() => state.remove(selected.value)} />
    </div>
  );
}

function SearchField({ onSelect, loader, placeholder, alreadySelected }) {
  const [selected, setSelected] = React.useState(null);

  const onChange = (value: Option | null): void => {
    onSelect(value);
    setSelected(null);
  };

  const filterOptions = (candidate: any): boolean => {
    return !alreadySelected.includes(candidate.value);
  };

  return (
    <PeopleSearch
      placeholder={placeholder}
      value={selected!}
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

interface AdminModalState {
  selected: Option[];
  add: (selection: Option) => void;
  remove: (id: string) => void;
  isModalOpen: boolean;
  setIsModalOpen: (value: boolean) => void;
  submit: () => Promise<void>;
  openModal: () => void;
  hideModal: () => void;
  search: (query: string) => Promise<Person[]>;
  excludeIds: string[];
}

function useAddAdminsModalState(form: FormState): AdminModalState {
  const search = People.usePeopleSearch();

  const [selected, setSelectedList] = React.useState<Option[]>([]);
  const [isModalOpen, setIsModalOpen]: [boolean, any] = React.useState(false);

  const add = (selection: Option) => setSelectedList([...selected, selection]);
  const remove = (id: string) => {
    setSelectedList(selected.filter((p) => p.value !== id));
  };

  const submit = async () => {
    await form.addAdmins(selected.map((s) => s.value));

    setIsModalOpen(false);
    setSelectedList([]);
  };

  const openModal = () => setIsModalOpen(true);
  const hideModal = () => setIsModalOpen(false);

  const excludeIds = React.useMemo(() => {
    return selected.map((s) => s.value).concat(form.company.admins!.map((a) => a!.id));
  }, [selected, form.company.admins]);

  return {
    selected,
    add,
    remove,
    isModalOpen,
    setIsModalOpen,
    submit,
    openModal,
    hideModal,
    search,
    excludeIds,
  };
}
