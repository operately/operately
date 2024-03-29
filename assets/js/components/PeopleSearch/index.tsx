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
  onChange: (value: Option | null) => void;
  loader: (input: string) => Promise<Person[]>;
  filterOption?: (candidate: any) => boolean;
  placeholder: string;
  alreadySelected?: string[];
  defaultValue?: Person;
  value?: Person | undefined;
  inputId?: string;
  showTitle?: boolean;
  error?: boolean;
}

export default function PeopleSearch(props: PeopleSearchProps) {
  const defaultValue = props.defaultValue && personAsOption(props.defaultValue, props.showTitle);

  const loadOptions = React.useCallback(
    throttle((input: string, callback: any) => {
      props
        .loader(input)
        .then((people) => {
          callback(people.map((person) => personAsOption(person, props.showTitle)));
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
      inputId={props.inputId || "people-search"}
      loadOptions={loadOptions}
      defaultValue={defaultValue}
      defaultOptions
      cacheOptions={false}
      filterOption={props.filterOption || (() => true)}
      value={props.value}
      classNames={classNames(props.error)}
      styles={{
        input: (provided) => ({
          ...provided,
          "input:focus": {
            boxShadow: "none",
          },
        }),
      }}
    />
  );
}

function classNames(error: boolean | undefined) {
  return {
    control: () => {
      if (error) {
        return "bg-surface placeholder-content-subtle border border-red-500 rounded-lg px-3";
      } else {
        return "bg-surface placeholder-content-subtle border border-surface-outline rounded-lg px-3";
      }
    },
    menu: () => "bg-surface text-content-accent border border-surface-outline rounded-lg mt-1 overflow-hidden",
    input: () => "placeholder-content-subtle focus:ring-0 outline-none",
    placeholder: () => "truncate",
    option: ({ isFocused }) =>
      classnames({
        "px-3 py-2 hover:bg-surface-dimmed cursor-pointer": true,
        "bg-surface": isFocused,
      }),
  };
}

function personAsOption(person: Person, showTitle = null): Option {
  return {
    value: person.id,
    label: <PersonLabel person={person} showTitle={!!showTitle} />,
    person: person,
  };
}

function PersonLabel({ person, showTitle }: { person: Person; showTitle: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <Avatar person={person} size={AvatarSize.Tiny} />
      {person.fullName}
      {showTitle && <>&middot; {person.title}</>}
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
