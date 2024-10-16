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
  error?: boolean;
  placeholder?: string;
}

interface SelectBoxProps extends SelectBoxNoLabelProps {
  label: string;
}

export function SelectBoxNoLabel(props: SelectBoxNoLabelProps) {
  const { value, onChange, options, allowEnteringNewValues, ...rest } = props;

  const element = allowEnteringNewValues ? CreatableSelect : Select;

  let selectProps = {
    unstyled: true,
    className: "flex-1",
    placeholder: props.placeholder,
    classNames: selectBoxStyles(props.error),
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

function selectBoxStyles(error: boolean | undefined) {
  return {
    control: () => {
      if (error) {
        return "bg-surface-base placeholder-content-dimmed border border-red-500 rounded-lg px-3 flex-1";
      } else {
        return "bg-surface-base placeholder-content-dimmed border border-surface-outline rounded-lg px-3 flex-1";
      }
    },
    menu: () => "bg-surface-base text-content-accent border border-surface-outline rounded-lg mt-1",
    option: ({ isFocused }) =>
      classnames({
        "px-3 py-2 hover:bg-surface-accent cursor-pointer": true,
        "bg-surface-accent": isFocused,
      }),
  };
}
