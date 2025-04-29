import * as React from "react";
import * as Popover from "@radix-ui/react-popover";

import { match } from "ts-pattern";
import { MonthPicker } from "./MonthPicker";
import { QuarterPicker } from "./QuarterPicker";
import { YearPicker } from "./YearPicker";
import { CustomRangePicker } from "./CustomRangePicker";
import { SegmentedControl } from "./SegmentedControl";

import classNames from "../utils/classnames";
import {
  currentMonth,
  currentQuarter,
  currentYear,
  formatTimeframe,
  Timeframe,
  TimeframeType,
} from "../utils/timeframes";

const DEFAULTS = {
  size: "base" as const,
  alignContent: "start" as const,
};

export namespace TimeframeSelectorDialog {
  export type SetTimeframe = (timeframe: Timeframe) => void;

  export interface Props {
    trigger?: React.ReactNode;
    timeframe: Timeframe;
    setTimeframe: SetTimeframe;
    alignContent?: "start" | "end";

    open: boolean;
    onOpenChange: (open: boolean) => void;
  }
}

export function TimeframeSelectorDialog(props: TimeframeSelectorDialog.Props) {
  props = { ...DEFAULTS, ...props };

  return (
    <Popover.Root open={props.open} onOpenChange={props.onOpenChange}>
      {props.trigger}
      <PopoverContent {...props} />
    </Popover.Root>
  );
}

type PopoverContentProps = TimeframeSelectorDialog.Props & {
  setTimeframe: (timeframe: Timeframe) => void;
};

function PopoverContent(props: PopoverContentProps) {
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

function TimeframeSelectorHeader(props: TimeframeSelectorDialog.Props) {
  return (
    <div className="flex items-center justify-between gap-10 w-full border-b border-stroke-base pb-3 mb-3">
      <div className="">
        <div className="font-bold shrink-0">Select Timeframe</div>
        <div className="text-content-dimmed text-xs">{formatTimeframe(props.timeframe)}</div>
      </div>

      <TimeframeSelectorTypeSelector {...props} />
    </div>
  );
}

function TimeframeSelectorTypeSelector(props: TimeframeSelectorDialog.Props) {
  const changeHandler = (value: string) => {
    match(value as TimeframeType)
      .with("year", () => props.setTimeframe(currentYear()))
      .with("quarter", () => props.setTimeframe(currentQuarter()))
      .with("month", () => props.setTimeframe(currentMonth()))
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

function TimeframeSelectorContent({ timeframe, setTimeframe }: TimeframeSelectorDialog.Props) {
  return match(timeframe.type)
    .with("month", () => <MonthPicker timeframe={timeframe} setTimeframe={setTimeframe} />)
    .with("quarter", () => <QuarterPicker timeframe={timeframe} setTimeframe={setTimeframe} />)
    .with("year", () => <YearPicker timeframe={timeframe} setTimeframe={setTimeframe} />)
    .with("days", () => <CustomRangePicker timeframe={timeframe} setTimeframe={setTimeframe} />)
    .exhaustive();
}
