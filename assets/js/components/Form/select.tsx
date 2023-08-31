import React from "react";

import Select from "react-select";
import CreatableSelect from "react-select/creatable";

import classnames from "classnames";

export function SelectBox({ label, value, onChange, options, allowEnteringNewValues, ...props }) {
  return (
    <div className="flex flex-col">
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
  control: () => "bg-shade-3 placeholder-white-2 border-none rounded-lg px-3",
  menu: () => "bg-dark-3 text-white-1 border border-white-3 rounded-lg mt-1",
  option: ({ isFocused }) =>
    classnames({
      "px-3 py-2 hover:bg-shade-1 cursor-pointer": true,
      "bg-shade-1": isFocused,
    }),
};
