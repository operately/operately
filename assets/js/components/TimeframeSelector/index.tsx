import * as React from "react";
import * as Popover from "@radix-ui/react-popover";
import * as Icons from "@tabler/icons-react";

import DatePicker from "react-datepicker";

interface TimeframeSelectorProps {}

const DIALOG_CLASSNAME = "rounded-lg border border-surface-outline z-[100] shadow-xl overflow-hidden bg-surface";

export function TimeframeSelector(props: TimeframeSelectorProps) {
  const [open, setOpen] = React.useState(true);
  const [segment, setSegment] = React.useState("quarterly");
  const [date, setDate] = React.useState<Date | null>(new Date());

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
          <div className="p-2 px-3">
            <SegmentedControl
              options={[
                { label: "Month", value: "monthly" },
                { label: "Quarter", value: "quarterly" },
                { label: "Annual", value: "annually" },
                { label: "Custom", value: "custom" },
              ]}
              value={segment}
              onChange={setSegment}
            />

            <TimeframeSelectorContent segment={segment} date={date} setDate={setDate} />
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function TimeframeSelectorContent({
  date,
  setDate,
  segment,
}: {
  date: Date | null;
  setDate: (date: Date) => void;
  segment: string;
}) {
  if (segment === "monthly") {
    return <DatePicker inline selected={date} onChange={setDate} showMonthYearPicker />;
  }

  if (segment === "quarterly") {
    const renderQuarterContent = (quarter: string, shortQuarter: string) => (
      <div className="flex items-center justify-center h-10 w-10">
        <span className="text-sm font-medium">Hey {quarter}</span>
      </div>
    );

    return (
      <DatePicker
        inline
        selected={date}
        onChange={setDate}
        calendarClassName="w-full"
        showQuarterYearPicker
        renderQuarterContent={renderQuarterContent}
      />
    );
  }

  if (segment === "annually") {
    return <DatePicker inline selected={date} onChange={setDate} showYearPicker />;
  }

  if (segment === "custom") {
    return (
      <DatePicker inline selected={date} onChange={setDate} className="bg-transparent" showFourColumnMonthYearPicker />
    );
  }
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
    <div
      className="grid gap-0.5 bg-base p-0.5 rounded-lg"
      style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}
    >
      {options.map((option) => (
        <button
          key={option.value}
          className={`px-2 py-1 rounded-lg text-sm font-medium ${
            option.value === value ? "bg-surface" : "transparent"
          }`}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
