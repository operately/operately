import React from "react";
import { useTranslation } from "react-i18next";

import AsyncSelect from "react-select/async";
import Modal from "./Modal";
import Button from "../../components/Button";

import { useApolloClient, gql } from "@apollo/client";
import { listPotentialGroupMembers } from "../../graphql/Groups";

interface Person {
  id: string;
  fullName: string;
  title: string;
}

interface SelectOption {
  value: string;
  label: string;
}

const ADD_MEMBERS = gql`
  mutation AddMembers($groupId: ID!, $personIds: [ID!]!) {
    addMembers(groupId: $groupId, personIds: $personIds) {
      id
    }
  }
`;

function convertToSelectOption(person: Person): SelectOption {
  let label = person.fullName;

  if (person.title && person.title !== "") {
    label += " - " + person.title;
  }

  return { value: person.id, label: label };
}

function convertToSelectOptions(people: Person[]): SelectOption[] {
  return people.map(convertToSelectOption);
}

function SearchField({ onSelect, loader, placeholder, alreadySelected }) {
  const [selected, setSelected] = React.useState(null);

  const onChange = (value: Person | null): void => {
    onSelect(value);
    setSelected(null);
  };

  const filterOptions = (candidate: SelectOption) => {
    return !alreadySelected.includes(candidate.value);
  };

  return (
    <AsyncSelect
      placeholder={placeholder}
      inputId="peopleSearch"
      value={selected}
      onChange={onChange}
      loadOptions={loader}
      defaultOptions
      filterOption={filterOptions}
    />
  );
}

function RemoveIcon({ onClick }) {
  return (
    <div className="hover:cursor-pointer" onClick={onClick}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        stroke="currentColor"
        className="w-6 h-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </div>
  );
}

function PeopleListItem({
  person,
  removePerson,
}: {
  person: SelectOption;
  removePerson: (id: string) => void;
}): JSX.Element {
  return (
    <div
      className="px-2 py-1 border border-gray-200 round flex justify-between"
      key={person.value}
    >
      <p>{person.label}</p>

      <RemoveIcon onClick={() => removePerson(person.value)} />
    </div>
  );
}

function PeopleList({
  people,
  removePerson,
}: {
  people: SelectOption[];
  removePerson: (id: string) => void;
}): JSX.Element {
  const list = people.map((p) => PeopleListItem({ person: p, removePerson }));

  return <div className="flex flex-col gap-2">{list}</div>;
}

export default function AddMembersModal({ groupId, onSubmit, members }) {
  const { t } = useTranslation();
  const client = useApolloClient();
  const [peopleList, setPeopleList]: [SelectOption[], any] = React.useState([]);
  const [isModalOpen, setIsModalOpen]: [boolean, any] = React.useState(false);

  const add = (person: SelectOption) => setPeopleList([...peopleList, person]);
  const remove = (id: string) => {
    setPeopleList(peopleList.filter((p) => p.value !== id));
  };

  const search = (value: string) => {
    return new Promise((resolve) => {
      let promise = listPotentialGroupMembers(client, {
        variables: {
          groupId,
          query: value,
          excludeIds: peopleList.map((p) => p.value),
          limit: 10,
        },
      });

      promise
        .then(({ data }) => convertToSelectOptions(data.potentialGroupMembers))
        .then((people: SelectOption[]) => resolve(people))
        .catch((err: any) => {
          console.log(err);
        });
    });
  };

  const submit = async () => {
    await client.mutate({
      mutation: ADD_MEMBERS,
      variables: {
        groupId,
        personIds: peopleList.map((p) => p.value),
      },
    });

    setIsModalOpen(false);
    setPeopleList([]);
    onSubmit();
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  const hideModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <Button onClick={openModal}>Add Members</Button>

      <Modal
        title={t("forms.add_group_members_title")}
        isOpen={isModalOpen}
        hideModal={hideModal}
      >
        <SearchField
          onSelect={add}
          loader={search}
          placeholder={t("forms.add_group_members_search_placeholder")}
          alreadySelected={
            peopleList.map((p) => p.value) + members.map((p) => p.id)
          }
        />

        <div className="flex flex-col gap-2 mt-4">
          <PeopleList people={peopleList} removePerson={remove} />
        </div>

        <div className="mt-4">
          <Button onClick={submit}>
            {t("forms.add_group_members_button")}
          </Button>
        </div>
      </Modal>
    </>
  );
}
