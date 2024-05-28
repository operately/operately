import * as React from "react";
import * as Popover from "@radix-ui/react-popover";
import * as Icons from "@tabler/icons-react";

import ReactDatePicker from "react-datepicker";
import FormattedTime from "@/components/FormattedTime";
import classNames from "classnames";

import { LeftChevron, RightChevron } from "@/components/TimeframeSelector/Chevrons";

interface DatepickerProps {
  date: Date;
  setDate: (date: Date) => void;
}

export function Datepicker(props: DatepickerProps) {
  const [open, setOpen] = React.useState(false);

  const handleDateChange = (date: Date) => {
    props.setDate(date);
    setOpen(false);
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <DatepickerFormElement {...props} />
      <PopeverContent date={props.date} setDate={handleDateChange} />
    </Popover.Root>
  );
}

function DatepickerFormElement(props: DatepickerProps) {
  return (
    <Popover.Trigger asChild>
      <div className="border border-surface-outline rounded-lg px-3 py-1.5 flex items-center gap-1 cursor-pointer bg-surface truncate">
        <Icons.IconCalendar size={18} className="shrink-0" />
        <span className="truncate">{<FormattedTime timezone={""} time={props.date} format="long-date" />}</span>
      </div>
    </Popover.Trigger>
  );
}

function PopeverContent(props: DatepickerProps) {
  const className = classNames(
    "z-[100] overflow-hidden",
    "border border-surface-outline",
    "rounded-lg shadow-xl",
    "bg-surface",
    "flex flex-col items-start p-3 pt-2",
  );

  return (
    <Popover.Portal>
      <Popover.Content className={className} align="start" sideOffset={5}>
        <ReactDatePicker
          inline
          selected={props.date}
          onChange={(date) => props.setDate(date as Date)}
          startDate={props.date}
          endDate={props.date}
          renderCustomHeader={Header}
        />
      </Popover.Content>
    </Popover.Portal>
  );
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function Header({ date, decreaseMonth, increaseMonth }) {
  const month = MONTHS[date.getMonth()];
  const year = date.getFullYear();

  return (
    <div className="flex items-center w-full px-1 pb-1 gap-4 font-medium">
      <LeftChevron onClick={decreaseMonth} />
      <div className="flex-1 text-center font-bold">
        {month} {year}
      </div>
      <RightChevron onClick={increaseMonth} />
    </div>
  );
}
