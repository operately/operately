import React from "react";
import AsyncSelect from "react-select/async";

import Avatar, { AvatarSize } from "@/components/Avatar";

interface Person {
  id: string;
  fullName: string;
  avatarUrl: string;
  title: string;
}

interface PeopleSearchProps {
  onChange: ({ value }: { value: string }) => void;
  loader: (input: string) => Promise<Person[]>;
  placeholder: string;
  alreadySelected?: string[];
}

export default function PersonSearch(props: PeopleSearchProps) {
  const loadOptions = async (input: string) => {
    const people = await props.loader(input);

    return people.map((person) => ({
      value: person.id,
      label: (
        <div className="flex items-center gap-2">
          <Avatar person={person} size={AvatarSize.Tiny} />
          {person.fullName} &middot; {person.title}
        </div>
      ),
    }));
  };

  return (
    <AsyncSelect
      unstyled
      placeholder={props.placeholder}
      onChange={props.onChange}
      inputId="peopleSearch"
      loadOptions={loadOptions}
      defaultOptions
      classNames={{
        control: () =>
          "bg-shade-2 placeholder-white-2 border-none rounded-lg px-3",
        menu: () =>
          "bg-dark-3 text-white-1 border border-white-3 rounded-lg mt-1",
        option: ({ isFocused }) => {
          return (
            "px-3 py-2 hover:bg-shade-1 cursor-pointer" +
            (isFocused ? " bg-shade-1" : "")
          );
        },
      }}
    />
  );
}
