import * as React from "react";
import * as Popover from "@radix-ui/react-popover";
import * as Icons from "@tabler/icons-react";

import { match } from "ts-pattern";

import { MonthPicker } from "./MonthPicker";
import { QuarterPicker } from "./QuarterPicker";
import { YearPicker } from "./YearPicker";
import { CustomRangePicker } from "./CustomRangePicker";
import { Timeframe, TimeframeType, SetTimeframe } from "./timeframe";
import { formatTimeframe } from "./formatTimeframe";

interface TimeframeSelectorProps {
  timeframe: Timeframe;
  setTimeframe: SetTimeframe;
}

export function TimeframeSelector(props: TimeframeSelectorProps) {
  const [open, setOpen] = React.useState(true);

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
      <div className="border border-surface-outline rounded-lg px-3 py-1.5 flex items-center gap-1 cursor-pointer bg-surface">
        <Icons.IconCalendar size={20} />
        <span>{formatTimeframe(props.timeframe)}</span>
      </div>
    </Popover.Trigger>
  );
}

function PopeverContent(props: TimeframeSelectorProps) {
  return (
    <Popover.Portal>
      <Popover.Content
        className={"rounded-lg border border-surface-outline z-[100] shadow-xl overflow-hidden bg-surface"}
        align="start"
        sideOffset={5}
      >
        <div className="flex flex-col items-start p-6">
          <div className="flex items-center justify-between gap-10 w-full border-b border-stroke-base pb-3 mb-3">
            <div className="">
              <div className="font-bold shrink-0">Select Timeframe</div>
              <div className="text-content-dimmed text-xs">{formatTimeframe(props.timeframe)}</div>
            </div>
            <SegmentedControl
              options={[
                { label: "Month", value: "month" },
                { label: "Quarter", value: "quarter" },
                { label: "Year", value: "year" },
                { label: "Custom", value: "days" },
              ]}
              value={props.timeframe.type}
              onChange={(value) => props.setTimeframe({ ...props.timeframe, type: value as TimeframeType })}
            />
          </div>

          <TimeframeSelectorContent timeframe={props.timeframe} setTimeframe={props.setTimeframe} />
        </div>
      </Popover.Content>
    </Popover.Portal>
  );
}

function TimeframeSelectorContent({ timeframe, setTimeframe }: { timeframe: Timeframe; setTimeframe: SetTimeframe }) {
  return match(timeframe.type)
    .with("month", () => <MonthPicker timeframe={timeframe} setTimeframe={setTimeframe} />)
    .with("quarter", () => <QuarterPicker timeframe={timeframe} setTimeframe={setTimeframe} />)
    .with("year", () => <YearPicker timeframe={timeframe} setTimeframe={setTimeframe} />)
    .with("days", () => <CustomRangePicker timeframe={timeframe} setTimeframe={setTimeframe} />)
    .exhaustive();
}

function SegmentedControl({
  options,
  value,
  onChange,
}: {
  options: any[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center bg-surface-dimmed p-0.5 rounded-lg">
      {options.map((option) => (
        <button
          key={option.value}
          className={`w-full px-2.5 py-1 text-sm font-medium rounded-lg ${
            option.value === value ? "bg-surface border border-stroke-base" : "bg-transparent"
          }`}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
