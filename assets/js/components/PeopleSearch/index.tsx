import React from "react";
import AsyncSelect from "react-select/async";

import Avatar, { AvatarSize } from "@/components/Avatar";
import classnames from "classnames";

import { Person } from "@/models/people";

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
  value?: Person | undefined | null;
  inputId?: string;
  showTitle?: boolean;
  error?: boolean;
}

export default function PeopleSearch(props: PeopleSearchProps) {
  const defaultValue = props.defaultValue && personAsOption(props.defaultValue, props.showTitle);
  const optionLoader = usePeopleOptionLoader(props);

  return (
    <AsyncSelect
      unstyled
      placeholder={props.placeholder}
      onChange={props.onChange}
      inputId={props.inputId || "people-search"}
      loadOptions={optionLoader}
      defaultValue={defaultValue}
      defaultOptions
      cacheOptions={false}
      filterOption={props.filterOption || (() => true)}
      value={props.value && personAsOption(props.value)}
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

function personAsOption(person: Person, showTitle = false): Option {
  return {
    value: person.id!,
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

function usePeopleOptionLoader(
  props: PeopleSearchProps,
): (input: string, callback: (options: Option[]) => void) => void {
  return React.useCallback(
    throttle(async (input: string, callback: any) => {
      try {
        const people = await props.loader(input);
        const options = people.map((person) => personAsOption(person, props.showTitle));

        callback(options);
      } catch (error) {
        console.error(error);
        callback([]);
      }
    }, 500),
    [props.loader],
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
