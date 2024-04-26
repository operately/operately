import * as React from "react";
import * as Popover from "@radix-ui/react-popover";
import * as Icons from "@tabler/icons-react";

import DatePicker from "react-datepicker";
import classNames from "classnames";

interface TimeframeSelectorProps {}

const DIALOG_CLASSNAME = "rounded-lg border border-surface-outline z-[100] shadow-xl overflow-hidden bg-surface";

export function TimeframeSelector(props: TimeframeSelectorProps) {
  const [open, setOpen] = React.useState(true);
  const [segment, setSegment] = React.useState("annually");
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
    const renderMonthContent = (_monthIndex: number, _shortMonthText: string, fullMonthText: string) => (
      <div className="text-left px-2 py-2 flex items-center justify-between font-medium">{fullMonthText}</div>
    );

    return (
      <DatePicker
        inline
        selected={date}
        onChange={setDate}
        calendarClassName="w-full"
        showMonthYearPicker
        renderMonthContent={renderMonthContent}
        renderCustomHeader={YearPickerHeader}
      />
    );
  }

  if (segment === "quarterly") {
    const ranges = {
      Q1: ["Jan 1", "Mar 31"],
      Q2: ["Apr 1", "Jun 30"],
      Q3: ["Jul 1", "Sep 30"],
      Q4: ["Oct 1", "Dec 31"],
    };

    const renderQuarterContent = (quarter: string) => (
      <div className="text-left px-4 py-2 flex items-center justify-between">
        <span className="font-medium">Q{quarter}</span>
        <span className="text-xs font-medium">
          {ranges[`Q${quarter}`][0]} &ndash; {ranges[`Q${quarter}`][1]}
        </span>
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
        renderCustomHeader={YearPickerHeader}
      />
    );
  }

  if (segment === "annually") {
    const renderContent = (year: number) => (
      <div className="text-left px-2 py-2 flex items-center justify-between font-medium">{year}</div>
    );

    return (
      <DatePicker
        inline
        selected={date}
        onChange={setDate}
        calendarClassName="w-full"
        showYearPicker
        yearItemNumber={6}
        renderYearContent={renderContent}
        renderCustomHeader={YearsPickerHeader}
      />
    );
  }

  if (segment === "custom") {
    const [startDate, setStartDate] = React.useState<Date | null>(null);
    const [endDate, setEndDate] = React.useState<Date | null>(null);

    return (
      <div className="flex items-start gap-6">
        <div className="flex flex-col items-start justify-start h-full">
          <div className="font-bold text-sm mb-1">Start Date</div>
          <DatePicker
            inline
            selected={startDate}
            onChange={setStartDate}
            startDate={startDate}
            endDate={endDate}
            showFourColumnMonthYearPicker
            renderCustomHeader={DatepickerHeader("streched")}
          />
        </div>

        <div className="flex flex-col items-center justify-center h-[240px]">
          <div className="w-px bg-stroke-base rounded-xl h-8 pt-20 mt-10"></div>
        </div>

        <div className="flex flex-col items-start justify-start h-full">
          <div className="font-bold text-sm mb-1">Due Date</div>

          <DatePicker
            inline
            selected={endDate}
            startDate={startDate}
            endDate={endDate}
            onChange={setEndDate}
            minDate={startDate}
            renderCustomHeader={DatepickerHeader("streched")}
            showFourColumnMonthYearPicker
          />
        </div>
      </div>
    );
  }

  throw new Error("Invalid segment");
}

function YearPickerHeader({ date, decreaseYear, increaseYear }) {
  return (
    <div className="flex items-center w-full px-1 pb-1 gap-2 font-medium mb-2">
      <Icons.IconChevronLeft
        size={16}
        onClick={decreaseYear}
        className="cursor-pointer text-content-dimmed hover:text-content"
      />

      <div>{date.getFullYear()}</div>

      <Icons.IconChevronRight
        size={16}
        onClick={increaseYear}
        className="cursor-pointer text-content-dimmed hover:text-content"
      />
    </div>
  );
}

function YearsPickerHeader({ date, decreaseYear, increaseYear, customHeaderCount }) {
  return (
    <div className="flex items-center w-full px-1 pb-1 gap-2 font-medium mb-2">
      <Icons.IconChevronLeft
        size={16}
        onClick={decreaseYear}
        className="cursor-pointer text-content-dimmed hover:text-content"
      />

      <div>
        {date.getFullYear()} {customHeaderCount}
      </div>

      <Icons.IconChevronRight
        size={16}
        onClick={increaseYear}
        className="cursor-pointer text-content-dimmed hover:text-content"
      />
    </div>
  );
}

function DatepickerHeader(variant: "streched" | "condensed", className?: string) {
  return ({ date, decreaseMonth, increaseMonth }) => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    return (
      <div
        className={classNames(
          "flex items-center w-full px-1 pb-1 gap-4 font-medium",
          {
            "justify-between": variant === "streched",
          },
          className,
        )}
      >
        <Icons.IconChevronLeft
          size={16}
          onClick={decreaseMonth}
          className="cursor-pointer text-content-dimmed hover:text-content"
        />
        <div>
          {months[date.getMonth()]} {date.getFullYear()}
        </div>

        <Icons.IconChevronRight
          size={16}
          onClick={increaseMonth}
          className="cursor-pointer text-content-dimmed hover:text-content"
        />
      </div>
    );
  };
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
