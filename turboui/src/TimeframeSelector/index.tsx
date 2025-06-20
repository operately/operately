import * as React from "react";
import * as Popover from "@radix-ui/react-popover";
import { IconCalendar, IconChevronDown, IconX } from "../icons";

import { TimeframeSelectorDialog } from "../TimeframeSelectorDialog";

import classNames from "../utils/classnames";
import { formatTimeframe } from "../utils/timeframes";

const DEFAULTS = {
  size: "base" as const,
  alignContent: "start" as const,
};

export namespace TimeframeSelector {
  export type TimeframeType = "month" | "quarter" | "year" | "days";

  export interface Timeframe {
    startDate: Date | null;
    endDate: Date | null;
    type: TimeframeType;
  }

  export type SetTimeframe = (timeframe: Timeframe) => void;

  export interface Props {
    timeframe: Timeframe;
    setTimeframe: SetTimeframe;
    size?: "xs" | "base";
    alignContent?: "start" | "end";
  }
}

export function TimeframeSelector(props: TimeframeSelector.Props) {
  props = { ...DEFAULTS, ...props };

  const [open, setOpen] = React.useState(false);
  const defaultTimeframeRef = React.useRef(props.timeframe);

  const isDefaultTimeframe = React.useMemo(() => {
    const defaultTf = defaultTimeframeRef.current;
    const currentTf = props.timeframe;

    if (defaultTf.type !== currentTf.type) return false;
    if (defaultTf.startDate?.getTime() !== currentTf.startDate?.getTime()) return false;
    if (defaultTf.endDate?.getTime() !== currentTf.endDate?.getTime()) return false;

    return true;
  }, [props.timeframe]);

  const resetToDefault = React.useCallback(() => {
    props.setTimeframe(defaultTimeframeRef.current);
  }, [props]);

  const handleTriggerClick = React.useCallback(() => {
    if (!isDefaultTimeframe) {
      resetToDefault();
    } else {
      setOpen(!open);
    }
  }, [isDefaultTimeframe, resetToDefault, open]);

  const handleOpenChange = React.useCallback(
    (isOpen: boolean) => {
      if (isOpen && !isDefaultTimeframe) {
        resetToDefault();
      } else {
        setOpen(isOpen);
      }
    },
    [isDefaultTimeframe, resetToDefault],
  );

  const trigger = (
    <TimeframeSelectorTrigger {...props} isDefaultTimeframe={isDefaultTimeframe} onClick={handleTriggerClick} />
  );

  return (
    <TimeframeSelectorDialog
      open={open}
      onOpenChange={handleOpenChange}
      trigger={trigger}
      timeframe={props.timeframe}
      setTimeframe={props.setTimeframe}
      alignContent={props.alignContent}
    />
  );
}

interface TimeframeSelectorTriggerProps {
  timeframe: TimeframeSelector.Timeframe;
  size?: "xs" | "base";
  isDefaultTimeframe: boolean;
  onClick: () => void;
}

function TimeframeSelectorTrigger(props: TimeframeSelectorTriggerProps) {
  const className = classNames(
    props.isDefaultTimeframe ? "bg-surface-base" : "bg-surface-highlight dark:bg-surface-dimmed/20",
    "hover:bg-surface-highlight dark:hover:bg-surface-dimmed/20",
    "border border-surface-outline",
    "rounded-lg",
    "flex items-center gap-1",
    "cursor-pointer truncate",
    {
      "px-3 py-1.5": props.size === "base",
      "px-3 py-1": props.size === "xs",
      "text-base": props.size === "base",
      "text-sm": props.size === "xs",
    },
  );

  const iconSize = props.size === "base" ? 18 : 16;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    props.onClick();
  };

  return (
    <Popover.Trigger asChild>
      <button type="button" className={className} onClick={handleClick}>
        <IconCalendar size={iconSize} className="shrink-0" />
        <span className="truncate">{formatTimeframe(props.timeframe)}</span>
        {props.isDefaultTimeframe ? (
          <IconChevronDown size={iconSize} className="shrink-0 ml-1" />
        ) : (
          <IconX size={iconSize} className="shrink-0 ml-1 cursor-pointer" />
        )}
      </button>
    </Popover.Trigger>
  );
}
