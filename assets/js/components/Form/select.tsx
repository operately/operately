import React from "react";

import Select from "react-select";
import CreatableSelect from "react-select/creatable";

import classnames from "classnames";

interface SelectBoxProps {
  label: string;
  value: any;
  onChange: (value: any) => void;
  options: any[];
  allowEnteringNewValues?: boolean;
  "data-test-id"?: string;
  props?: any;
}

export function SelectBox({ label, value, onChange, options, allowEnteringNewValues, ...props }: SelectBoxProps) {
  const dataTestId = props["data-test-id"];

  return (
    <div className="flex flex-col" data-test-id={dataTestId}>
      <label className="font-bold mb-1 block">{label}</label>
      {allowEnteringNewValues ? (
        <CreatableSelect
          unstyled
          formatCreateLabel={(value) => {
            return <span>Custom: {value}</span>;
          }}
          classNames={SELECT_BOX_STYLES}
          value={value}
          onChange={onChange}
          options={options}
          {...props}
        />
      ) : (
        <Select
          unstyled
          classNames={SELECT_BOX_STYLES}
          value={value}
          onChange={onChange}
          options={options}
          {...props}
        />
      )}
    </div>
  );
}

const SELECT_BOX_STYLES = {
  control: () => "bg-surface placeholder-content-dimmed border border-surface-outline rounded-lg px-3",
  menu: () => "bg-surface text-content-accent border border-surface-outline rounded-lg mt-1",
  option: ({ isFocused }) =>
    classnames({
      "px-3 py-2 hover:bg-surface-accent cursor-pointer": true,
      "bg-surface-accent": isFocused,
    }),
};
