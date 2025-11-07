import React from "react";

import classNames from "classnames";

import { Target } from "./types";
import { ExpandIcon, TargetDetails, TargetNameSection, TargetValue } from "./components";

interface Props {
  index: number;
  target: Target;
  readonly?: boolean;
  editValue?: boolean;
}

export function DefaultTargetCard(props: Props) {
  const [open, setOpen] = React.useState(false);
  const { index, target, readonly } = props;

  const readonlyValue = Boolean(readonly || !props.editValue);
  const containerClass = classNames("max-w-full py-2 px-px border-t last:border-b border-stroke-base");

  const handleToggle = () => {
    setOpen(!open);
  };

  const handleProgration = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (!readonly) {
      e.stopPropagation()
    }
  }

  return (
    <div className={containerClass}>
      <div onClick={handleToggle} className="grid grid-cols-[1fr_auto_14px] gap-2 items-start cursor-pointer">
        <TargetNameSection target={target} truncate={!open} />
        <div onClick={handleProgration}>
          <TargetValue readonly={readonlyValue} index={index} target={target} />
        </div>
        <ExpandIcon expanded={open}  />
      </div>
      {open && <TargetDetails target={target} />}
    </div>
  );
}
