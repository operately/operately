import React from "react";
import AsyncSelect from "react-select/async";

import Avatar, { AvatarSize } from "@/components/Avatar";
import classnames from "classnames";

export interface Person {
  id: string;
  fullName: string;
  avatarUrl: string;
  title: string;
}

export interface Option {
  value: string;
  label: React.ReactNode;
  person: Person;
}

interface PeopleSearchProps {
  onChange: (value: Person | null) => void;
  loader: (input: string) => Promise<Person[]>;
  filterOption?: (candidate: any) => boolean;
  placeholder: string;
  alreadySelected?: string[];
  defaultValue?: Person;
  value?: Person | null;
}

export default function PeopleSearch(props: PeopleSearchProps) {
  const defaultValue = props.defaultValue && personAsOption(props.defaultValue);

  const loadOptions = async (input: string) => {
    const people = await props.loader(input);
    return people.map(personAsOption);
  };

  return (
    <AsyncSelect
      unstyled
      placeholder={props.placeholder}
      onChange={props.onChange}
      inputId="peopleSearch"
      loadOptions={loadOptions}
      defaultValue={defaultValue}
      defaultOptions
      cacheOptions={false}
      filterOption={props.filterOption || (() => true)}
      value={props.value || null}
      classNames={classNames()}
    />
  );
}

function classNames() {
  return {
    control: () => "bg-shade-3 placeholder-white-2 border-none rounded-lg px-3",
    menu: () => "bg-dark-3 text-white-1 border border-white-3 rounded-lg mt-1",
    option: ({ isFocused }) =>
      classnames({
        "px-3 py-2 hover:bg-shade-1 cursor-pointer": true,
        "bg-shade-1": isFocused,
      }),
  };
}

function personAsOption(person: Person): Option {
  return {
    value: person.id,
    label: <PersonLabel person={person} />,
    person: person,
  };
}

function PersonLabel({ person }: { person: Person }) {
  return (
    <div className="flex items-center gap-2">
      <Avatar person={person} size={AvatarSize.Tiny} />
      {person.fullName} &middot; {person.title}
    </div>
  );
}
