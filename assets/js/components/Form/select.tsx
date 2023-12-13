import React from "react";

import Select from "react-select";
import CreatableSelect from "react-select/creatable";

import classnames from "classnames";

interface SelectBoxNoLabelProps {
  value: any;
  onChange: (value: any) => void;
  options: any[];
  allowEnteringNewValues?: boolean;
  "data-test-id"?: string;
  props?: any;
  defaultValue?: any;
}

interface SelectBoxProps extends SelectBoxNoLabelProps {
  label: string;
}

function SelectBoxNoLabel(props: SelectBoxNoLabelProps) {
  const { value, onChange, options, allowEnteringNewValues, ...rest } = props;

  const element = allowEnteringNewValues ? CreatableSelect : Select;

  let selectProps = {
    unstyled: true,
    className: "flex-1",
    classNames: SELECT_BOX_STYLES,
    value: value,
    onChange: onChange,
    options: options,
    styles: {
      input: (provided: any) => ({
        ...provided,
        "input:focus": {
          boxShadow: "none",
        },
      }),
    },
    ...rest,
  };

  if (allowEnteringNewValues) {
    selectProps["formatCreateLabel"] = (value: any) => {
      return <span>Custom: {value}</span>;
    };
  }

  return React.createElement(element, selectProps);
}

export function SelectBox({ label, value, onChange, options, allowEnteringNewValues, ...props }: SelectBoxProps) {
  const dataTestId = props["data-test-id"];

  return (
    <div className="flex flex-col" data-test-id={dataTestId}>
      <label className="font-bold mb-1 block">{label}</label>
      <SelectBoxNoLabel
        value={value}
        onChange={onChange}
        options={options}
        allowEnteringNewValues={allowEnteringNewValues}
        data-test-id={dataTestId}
        {...props}
      />
    </div>
  );
}

const SELECT_BOX_STYLES = {
  control: () => "bg-surface placeholder-content-dimmed border border-surface-outline rounded-lg px-3 flex-1",
  menu: () => "bg-surface text-content-accent border border-surface-outline rounded-lg mt-1",
  option: ({ isFocused }) =>
    classnames({
      "px-3 py-2 hover:bg-surface-accent cursor-pointer": true,
      "bg-surface-accent": isFocused,
    }),
};
