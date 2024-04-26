import * as React from "react";
import * as Popover from "@radix-ui/react-popover";
import * as Icons from "@tabler/icons-react";

import { match } from "ts-pattern";

import { MonthPicker } from "./MonthPicker";
import { QuarterPicker } from "./QuarterPicker";
import { YearPicker } from "./YearPicker";
import { CustomRangePicker } from "./CustomRangePicker";

import { useRange, Range, SetRange } from "./useRange";

type Segment = "monthly" | "quarterly" | "annually" | "custom";

interface TimeframeSelectorProps {}

const DIALOG_CLASSNAME = "rounded-lg border border-surface-outline z-[100] shadow-xl overflow-hidden bg-surface";

export function TimeframeSelector(props: TimeframeSelectorProps) {
  const [open, setOpen] = React.useState(true);
  const [segment, setSegment] = React.useState("annually");
  const [range, setRange] = useRange(null, null);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <div className="border border-surface-outline rounded-lg px-3 py-1.5 flex items-center gap-1 cursor-pointer bg-surface">
          <Icons.IconCalendar size={20} />
          <span>Timeframe</span>
        </div>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content className={DIALOG_CLASSNAME} align="start" sideOffset={5}>
          <div className="flex flex-col items-start p-6">
            <div className="flex items-center justify-between gap-10 w-full border-b border-stroke-base pb-3 mb-3">
              <div className="">
                <div className="font-bold shrink-0">Select Timeframe</div>
                <div className="text-content-dimmed text-xs">Apr 1 - Jun 30, 2024</div>
              </div>
              <SegmentedControl
                options={[
                  { label: "Month", value: "monthly" },
                  { label: "Quarter", value: "quarterly" },
                  { label: "Year", value: "annually" },
                  { label: "Custom", value: "custom" },
                ]}
                value={segment}
                onChange={setSegment}
              />
            </div>

            <TimeframeSelectorContent segment={segment as Segment} range={range} setRange={setRange} />
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function TimeframeSelectorContent({
  range,
  setRange,
  segment,
}: {
  range: Range;
  setRange: SetRange;
  segment: Segment;
}) {
  return match(segment)
    .with("monthly", () => <MonthPicker range={range} setRange={setRange} />)
    .with("quarterly", () => <QuarterPicker range={range} setRange={setRange} />)
    .with("annually", () => <YearPicker range={range} setRange={setRange} />)
    .with("custom", () => <CustomRangePicker range={range} setRange={setRange} />)
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
