import React from "react";

import { IconChevronDown, IconChevronLeft } from "@tabler/icons-react";
import classNames from "classnames";

import { Target } from "./types";
import { TargetDetails, TargetNameSection, TargetValue } from "./components";

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
    if (!readonly) return;
    setOpen(!open);
  };

  const handleChevronToggle = () => {
    if (readonly) return;
    setOpen(!open);
  };
  const ChevronIcon = open ? IconChevronDown : IconChevronLeft;

  return (
    <div className={containerClass}>
      <div onClick={handleToggle} className="grid grid-cols-[1fr_auto_14px] gap-2 items-start cursor-pointer">
        <TargetNameSection target={target} truncate={!open} />
        <TargetValue readonly={readonlyValue} index={index} target={target} />
        <ChevronIcon onClick={handleChevronToggle} size={14} className="mt-1.5" />
      </div>
      {open && <TargetDetails target={target} />}
    </div>
  );
}
