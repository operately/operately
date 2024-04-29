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
}

export function TimeframeSelector(props: TimeframeSelectorProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <TimeframeSelectorFormElement {...props} />
      <PopeverContent {...props} />
    </Popover.Root>
  );
}

function TimeframeSelectorFormElement(props: TimeframeSelectorProps) {
  return (
    <Popover.Trigger asChild>
      <div className="border border-surface-outline rounded-lg px-3 py-1.5 flex items-center gap-1 cursor-pointer bg-surface truncate">
        <Icons.IconCalendar size={18} className="shrink-0" />
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
    "bg-surface",
    "flex flex-col items-start p-6",
  );

  return (
    <Popover.Portal>
      <Popover.Content className={className} align="start" sideOffset={5}>
        <TimeframeSelectorHeader timeframe={props.timeframe} setTimeframe={props.setTimeframe} />
        <TimeframeSelectorContent timeframe={props.timeframe} setTimeframe={props.setTimeframe} />
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

      <TimeframeSelectorTypeSelector timeframe={props.timeframe} setTimeframe={props.setTimeframe} />
    </div>
  );
}

function TimeframeSelectorTypeSelector(props: TimeframeSelectorProps) {
  return (
    <SegmentedControl
      options={[
        { label: "Year", value: "year" },
        { label: "Quarter", value: "quarter" },
        { label: "Month", value: "month" },
        { label: "Custom", value: "days" },
      ]}
      value={props.timeframe.type}
      onChange={(value) => props.setTimeframe({ ...props.timeframe, type: value as Timeframes.TimeframeType })}
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
