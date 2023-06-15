import React from "react";
import AsyncSelect from "react-select/async";

interface Person {
  id: string;
  fullName: string;
  avatarUrl: string;
  title: string;
}

interface PeopleSearchProps {
  onSelect: (person: Person | null) => void;
  loader: (input: string) => Promise<Person[]>;
  placeholder: string;
  alreadySelected?: string[];
}

export default function PersonSearch(props: PeopleSearchProps) {
  const [selected, setSelected] = React.useState(null);

  const onChange = (value: Person | null): void => {
    props.onSelect(value);
    setSelected(null);
  };

  return (
    <AsyncSelect
      unstyled
      placeholder={props.placeholder}
      inputId="peopleSearch"
      value={selected}
      onChange={onChange}
      loadOptions={props.loader}
      defaultOptions
      classNames={{
        control: () =>
          "bg-shade-2 placeholder-white-2 border-none rounded-lg px-3",
        menu: () => "bg-shade-2 text-white-1 px-3",
        option: () => "py-2",
      }}
    />
  );
}
