import * as React from "react";
import * as Popover from "@radix-ui/react-popover";
import * as Icons from "@tabler/icons-react";
import * as Timeframes from "@/utils/timeframes";

import { match } from "ts-pattern";

import { MonthPicker } from "./MonthPicker";
import { QuarterPicker } from "./QuarterPicker";
import { YearPicker } from "./YearPicker";
import { CustomRangePicker } from "./CustomRangePicker";
import { SegmentedControl } from "./SegmentedControl";

import classNames from "classnames";

interface TimeframeSelectorProps {
  timeframe: Timeframes.Timeframe;
  setTimeframe: Timeframes.SetTimeframe;
  size?: "xs" | "base";
  alignContent?: "start" | "end";
}

const DEFAULTS = {
  size: "base" as const,
  alignContent: "start" as const,
};

export function TimeframeSelector(props: TimeframeSelectorProps) {
  props = { ...DEFAULTS, ...props };

  const [open, setOpen] = React.useState(false);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <TimeframeSelectorFormElement {...props} />
      <PopeverContent {...props} />
    </Popover.Root>
  );
}

function TimeframeSelectorFormElement(props: TimeframeSelectorProps) {
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
    },
  );

  const iconSize = props.size === "base" ? 18 : 16;

  return (
    <Popover.Trigger asChild>
      <div className={className}>
        <Icons.IconCalendar size={iconSize} className="shrink-0" />
        <span className="truncate">{Timeframes.format(props.timeframe)}</span>
      </div>
    </Popover.Trigger>
  );
}

function PopeverContent(props: TimeframeSelectorProps) {
  const className = classNames(
    "z-[100] overflow-hidden",
    "border border-surface-outline",
    "rounded-lg shadow-xl",
    "bg-surface-base",
    "flex flex-col items-start p-6",
  );

  return (
    <Popover.Portal>
      <Popover.Content className={className} align={props.alignContent} sideOffset={5}>
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
        <div className="text-content-dimmed text-xs">{Timeframes.format(props.timeframe)}</div>
      </div>

      <TimeframeSelectorTypeSelector {...props} />
    </div>
  );
}

function TimeframeSelectorTypeSelector(props: TimeframeSelectorProps) {
  const changeHandler = (value: Timeframes.TimeframeType) => {
    match(value)
      .with("year", () => props.setTimeframe(Timeframes.currentYear()))
      .with("quarter", () => props.setTimeframe(Timeframes.currentQuarter()))
      .with("month", () => props.setTimeframe(Timeframes.currentMonth()))
      .with("days", () => props.setTimeframe({ ...props.timeframe, type: "days" }))
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

function TimeframeSelectorContent({ timeframe, setTimeframe }: TimeframeSelectorProps) {
  return match(timeframe.type)
    .with("month", () => <MonthPicker timeframe={timeframe} setTimeframe={setTimeframe} />)
    .with("quarter", () => <QuarterPicker timeframe={timeframe} setTimeframe={setTimeframe} />)
    .with("year", () => <YearPicker timeframe={timeframe} setTimeframe={setTimeframe} />)
    .with("days", () => <CustomRangePicker timeframe={timeframe} setTimeframe={setTimeframe} />)
    .exhaustive();
}
