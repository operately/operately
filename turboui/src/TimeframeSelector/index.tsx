import * as React from "react";
import * as Popover from "@radix-ui/react-popover";
import * as Icons from "@tabler/icons-react";
import { TimeframeSelector as TimeframeSelectorNamespace } from "./types";

import { match } from "ts-pattern";

import { MonthPicker } from "./MonthPicker";
import { QuarterPicker } from "./QuarterPicker";
import { YearPicker } from "./YearPicker";
import { CustomRangePicker } from "./CustomRangePicker";
import { SegmentedControl } from "./SegmentedControl";
import { LeftChevron, RightChevron } from "./Chevrons";

import classNames from "../utils/classnames";
import {
  currentMonth,
  currentQuarter,
  currentYear,
  formatTimeframe,
} from "./utils";

export type { TimeframeSelectorNamespace };
export {
  CustomRangePicker,
  LeftChevron,
  RightChevron,
};

const DEFAULTS = {
  size: "base" as const,
  alignContent: "start" as const,
};

interface TimeframeSelectorProps {
    timeframe: TimeframeSelectorNamespace.Timeframe;
    setTimeframe: TimeframeSelectorNamespace.SetTimeframe;
    size?: "xs" | "base";
    alignContent?: "start" | "end";
  }

export function TimeframeSelector(props: TimeframeSelectorProps) {
  props = { ...DEFAULTS, ...props };

  const [open, setOpen] = React.useState(false);
  const defaultTimeframeRef = React.useRef(props.timeframe);

  const isDefaultTimeframe = React.useMemo(() => {
    const defaultTf = defaultTimeframeRef.current;
    const currentTf = props.timeframe;

    if (defaultTf.type !== currentTf.type) return false;
    if (defaultTf.startDate?.getTime() !== currentTf.startDate?.getTime())
      return false;
    if (defaultTf.endDate?.getTime() !== currentTf.endDate?.getTime())
      return false;

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

  const handleOpenChange = React.useCallback((isOpen: boolean) => {
    if (isOpen && !isDefaultTimeframe) {
      resetToDefault();
    } else {
      setOpen(isOpen);
    }
  }, [isDefaultTimeframe, resetToDefault]);

  return (
    <Popover.Root open={open} onOpenChange={handleOpenChange}>
      <TimeframeSelectorTrigger
        {...props}
        isDefaultTimeframe={isDefaultTimeframe}
        onClick={handleTriggerClick}
      />
      <PopoverContent {...props} />
    </Popover.Root>
  );
}


interface TimeframeSelectorTriggerProps {
  timeframe: TimeframeSelectorNamespace.Timeframe;
  size?: "xs" | "base";
  isDefaultTimeframe: boolean;
  onClick: () => void;
}

function TimeframeSelectorTrigger(props: TimeframeSelectorTriggerProps) {
  const className = classNames(
    "border border-surface-outline",
    "rounded-lg",
    "flex items-center gap-1",
    "cursor-pointer bg-surface-base truncate",
    {
      "px-3 py-1.5": props.size === "base",
      "px-3 py-1": props.size === "xs",
      "text-base": props.size === "base",
      "text-sm": props.size === "xs",
    }
  );

  const iconSize = props.size === "base" ? 18 : 16;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    props.onClick();
  };

  return (
    <Popover.Trigger asChild>
      <button type="button" className={className} onClick={handleClick}>
        <Icons.IconCalendar size={iconSize} className="shrink-0" />
        <span className="truncate">{formatTimeframe(props.timeframe)}</span>
        {props.isDefaultTimeframe ? (
          <Icons.IconChevronDown size={iconSize} className="shrink-0 ml-1" />
        ) : (
          <Icons.IconX
            size={iconSize}
            className="shrink-0 ml-1 cursor-pointer"
          />
        )}
      </button>
    </Popover.Trigger>
  );
}

function PopoverContent(props: TimeframeSelectorProps & { setTimeframe: (timeframe: TimeframeSelectorNamespace.Timeframe) => void }) {
  const className = classNames(
    "z-[100] overflow-hidden",
    "border border-surface-outline",
    "rounded-lg shadow-xl",
    "bg-surface-base",
    "flex flex-col items-start p-6"
  );

  return (
    <Popover.Portal>
      <Popover.Content
        className={className}
        align={props.alignContent}
        sideOffset={5}
      >
        <TimeframeSelectorHeader {...props} />
        <TimeframeSelectorContent {...props} />
      </Popover.Content>
    </Popover.Portal>
  );
}

function TimeframeSelectorHeader(props: TimeframeSelectorProps) {
  return (
    <div className="flex items-center justify-between gap-10 w-full border-b border-stroke-base pb-3 mb-3">
      <div className="">
        <div className="font-bold shrink-0">Select Timeframe</div>
        <div className="text-content-dimmed text-xs">
          {formatTimeframe(props.timeframe)}
        </div>
      </div>

      <TimeframeSelectorTypeSelector {...props} />
    </div>
  );
}

function TimeframeSelectorTypeSelector(props: TimeframeSelectorProps) {
  const changeHandler = (value: string) => {
    match(value as TimeframeSelectorNamespace.TimeframeType)
      .with("year", () => props.setTimeframe(currentYear()))
      .with("quarter", () => props.setTimeframe(currentQuarter()))
      .with("month", () => props.setTimeframe(currentMonth()))
      .with("days", () =>
        props.setTimeframe({ ...props.timeframe, type: "days" })
      )
      .exhaustive();
  };

  return (
    <SegmentedControl
      options={[
        { label: "Year", value: "year" },
        { label: "Quarter", value: "quarter" },
        { label: "Month", value: "month" },
        { label: "Custom", value: "days" },
      ]}
      value={props.timeframe.type}
      onChange={changeHandler}
    />
  );
}

function TimeframeSelectorContent({
  timeframe,
  setTimeframe,
}: TimeframeSelectorProps) {
  return match(timeframe.type)
    .with("month", () => (
      <MonthPicker timeframe={timeframe} setTimeframe={setTimeframe} />
    ))
    .with("quarter", () => (
      <QuarterPicker timeframe={timeframe} setTimeframe={setTimeframe} />
    ))
    .with("year", () => (
      <YearPicker timeframe={timeframe} setTimeframe={setTimeframe} />
    ))
    .with("days", () => (
      <CustomRangePicker timeframe={timeframe} setTimeframe={setTimeframe} />
    ))
    .exhaustive();
}
