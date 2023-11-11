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
  value?: Person | undefined;
}

export default function PeopleSearch(props: PeopleSearchProps) {
  const defaultValue = props.defaultValue && personAsOption(props.defaultValue);

  const loadOptions = React.useCallback(
    throttle((input: string, callback: any) => {
      props
        .loader(input)
        .then((people) => {
          callback(people.map(personAsOption));
        })
        .catch((err) => {
          console.error(err);
          callback([]);
        });
    }, 500),
    [props.loader],
  );

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
      value={props.value}
      classNames={classNames()}
    />
  );
}

function classNames() {
  return {
    control: () => "bg-surface placeholder-content-dimmed border border-surface-outline rounded-lg px-3",
    menu: () => "bg-surface text-content-accent border border-surface-outline rounded-lg mt-1",
    option: ({ isFocused }) =>
      classnames({
        "px-3 py-2 hover:bg-surface cursor-pointer": true,
        "bg-surface": isFocused,
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

const throttle = (callback: any, wait: number) => {
  let timeoutId: number | null = null;

  return (...args: any[]) => {
    if (timeoutId) window.clearTimeout(timeoutId);

    timeoutId = window.setTimeout(() => {
      callback.apply(null, args);
    }, wait);
  };
};
