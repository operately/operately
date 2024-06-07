import React from "react";
import classnames from "classnames";
import * as Icons from "@tabler/icons-react";

import * as Popover from "@radix-ui/react-popover";
import DatePicker from "react-datepicker";
import FormattedTime from "@/components/FormattedTime";

interface DateSelectorProps {
  id?: string;
  label: string;
  date: Date;
  onChange: (date: Date) => void;
  minDate: Date | null;
  maxDate: Date | null;
  placeholder: string;
  testID: string;
  error: boolean;
}

export function DateSelector(props: DateSelectorProps) {
  const { id, label, date, onChange, minDate, maxDate, error } = props;

  const className = classnames(
    "border border-surface-outline rounded-lg px-3 py-1.5 flex items-center gap-1 cursor-pointer",
    {
      "border-surface-outline": !error,
      "border-red-500": error,
    },
  );

  const [open, setOpen] = React.useState(false);

  const onChangeDate = React.useCallback((date: Date) => {
    setOpen(false);
    onChange(date);
  }, []);

  return (
    <div>
      <label htmlFor={id} className="font-bold mb-1 block">
        {label}
      </label>

      <div className="w-64">
        <Popover.Root open={open} onOpenChange={setOpen}>
          <Popover.Trigger asChild>
            <div className={className}>
              <Icons.IconCalendar size={20} />
              <FormattedTime time={date} format="short-date-with-weekday" />
            </div>
          </Popover.Trigger>

          <Popover.Portal>
            <Popover.Content className="bg-surface outline-red-400 border border-surface-outline" align="start">
              <DatePicker
                inline
                selected={date}
                onChange={onChangeDate}
                minDate={minDate}
                maxDate={maxDate}
                className="border-none"
              ></DatePicker>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      </div>
    </div>
  );
}
