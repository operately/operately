import React from "react";
import AsyncSelect from "react-select/async";

interface Person {
  id: string;
  fullName: string;
  title: string;
}

interface SelectOption {
  value: string;
  label: string;
}

export default function PersonSearch({
  onSelect,
  loader,
  placeholder,
  alreadySelected,
}) {
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
      unstyled
      placeholder={placeholder}
      inputId="peopleSearch"
      value={selected}
      onChange={onChange}
      loadOptions={loader}
      defaultOptions
      filterOption={filterOptions}
      classNames={{
        control: () =>
          "bg-shade-2 placeholder-white-2 border-none rounded-lg px-3",
        menu: () => "bg-shade-2 text-white-1 px-3",
        option: () => "py-2",
      }}
    />
  );
}
