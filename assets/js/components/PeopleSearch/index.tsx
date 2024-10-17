import React from "react";
import AsyncSelect from "react-select/async";

import Avatar, { AvatarSize } from "@/components/Avatar";
import classnames from "classnames";

import { Person } from "@/models/people";
import { createTestId } from "@/utils/testid";

export interface Option {
  value: string | null;
  label: React.ReactNode;
  person?: Person;
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

  allowEmptySelection?: boolean;
  emptySelectionLabel?: string;
}

export default function PeopleSearch(props: PeopleSearchProps) {
  validateProps(props);

  const defaultValue = props.defaultValue && personAsOption(props.defaultValue, props.showTitle);
  const optionLoader = usePeopleOptionLoader(props);

  return (
    <AsyncSelect
      unstyled
      autoFocus={true}
      placeholder={props.placeholder}
      onChange={props.onChange}
      inputId={props.inputId || "people-search"}
      loadOptions={optionLoader}
      defaultValue={defaultValue}
      defaultOptions
      cacheOptions={false}
      filterOption={props.filterOption || (() => true)}
      value={props.value && personAsOption(props.value)}
      classNames={asyncSelectClassNames(!!props.error)}
      styles={asyncSelectStyles()}
    />
  );
}

function asyncSelectStyles() {
  return {
    input: (provided: any) => ({
      ...provided,
      "input:focus": {
        boxShadow: "none",
      },
    }),
  };
}

function asyncSelectClassNames(error: boolean) {
  return {
    control: ({ isFocused }) => {
      if (error) {
        return "bg-surface-base placeholder-content-subtle border border-red-500 rounded-lg px-3";
      }

      if (isFocused) {
        return "bg-surface-base placeholder-content-subtle border-2 border-blue-600 rounded-lg px-3";
      }

      return "bg-surface-base placeholder-content-subtle border border-surface-outline rounded-lg px-3";
    },
    menu: () => "bg-surface-base text-content-accent border border-surface-outline rounded-lg mt-1 overflow-hidden",
    input: () => "placeholder-content-subtle focus:ring-0 outline-none",
    placeholder: () => "truncate",
    option: ({ isFocused, data }) => {
      return classnames({
        "px-3 py-2 hover:bg-surface-dimmed cursor-pointer": true,
        "bg-surface-dimmed": isFocused,
        "border-t border-stroke-dimmed": data.value === null,
      });
    },
  };
}

type LoaderFunction = (input: string, callback: (options: Option[]) => void) => void;

function usePeopleOptionLoader(props: PeopleSearchProps): LoaderFunction {
  return React.useCallback(
    throttle(async (input: string, callback: any) => {
      try {
        const people = await props.loader(input);
        const options = people.map((person) => personAsOption(person, props.showTitle));

        if (props.allowEmptySelection) {
          options.push(emptySelectionOption(props.emptySelectionLabel!));
        }

        callback(options);
      } catch (error) {
        console.error(error);
        callback([]);
      }
    }, 500),
    [props.loader],
  );
}

function emptySelectionOption(label: string): Option {
  return {
    value: null,
    label: (
      <div className="flex items-center gap-2" data-test-id={createTestId("person-option-nobody")}>
        {label}
      </div>
    ),
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
    <div className="flex items-center gap-2" data-test-id={createTestId("person-option", person.fullName!)}>
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

function validateProps(props: PeopleSearchProps) {
  if (props.allowEmptySelection && !props.emptySelectionLabel) {
    throw new Error("emptySelectionLabel is required when allowEmptySelection is true");
  }
}
