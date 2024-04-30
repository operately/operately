import React from "react";
import classNames from "classnames";

interface SegmentedControlProps {
  options: any[];
  value: string;
  onChange: (value: string) => void;
}

export function SegmentedControl(props: SegmentedControlProps) {
  return (
    <div className="flex items-center bg-surface-dimmed p-0.5 rounded-lg">
      {props.options.map((option) => (
        <SegmentedControlOption
          key={option.value}
          label={option.label}
          value={option.value}
          onChange={props.onChange}
          activeValue={props.value}
        />
      ))}
    </div>
  );
}

interface SegmentedControlOptionProps {
  activeValue: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function SegmentedControlOption(props: SegmentedControlOptionProps) {
  const className = classNames("w-full px-2.5 py-1 text-sm font-medium rounded-lg", {
    "bg-surface border border-stroke-base": props.value === props.activeValue,
    "bg-transparent": props.value !== props.activeValue,
  });

  return (
    <button key={props.value} className={className} onClick={() => props.onChange(props.value)}>
      {props.label}
    </button>
  );
}
