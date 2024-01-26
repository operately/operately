import React from "react";
import classnames from "classnames";

import * as Popover from "@radix-ui/react-popover";
import DatePicker from "react-datepicker";
import FormattedTime from "@/components/FormattedTime";

export function DateSelector({ date, onChange, minDate, maxDate, placeholder = "Not set", testID, error = false }) {
  const [open, setOpen] = React.useState(false);

  const onChangeDate = React.useCallback((date: Date) => {
    setOpen(false);
    onChange(date);
  }, []);

  const onLabelClick = React.useCallback(() => {
    setOpen(true);
  }, []);

  const className = classnames(
    {
      "bg-surface-dimmed hover:bg-surface-accent": date,
      "bg-surface hover:bg-surface-accent": !date,
      "border border-red-500": error,
    },
    "border border-surface-outline",
    "rounded px-2 py-2",
    "relative",
    "group",
    "cursor-pointer",
    "w-full outline-none leading-none",
  );

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <div className={className} onClick={onLabelClick} data-test-id={testID}>
          {date ? (
            <span className="text-content-accent">
              <FormattedTime time={date} format="short-date" />
            </span>
          ) : (
            <span className="text-content-subtle">{placeholder}</span>
          )}
        </div>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content className="outline-red-400 border border-surface-outline z-50" align="start">
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
  );
}
