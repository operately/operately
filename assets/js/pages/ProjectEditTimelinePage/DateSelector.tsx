import React from "react";

import * as Popover from "@radix-ui/react-popover";
import DatePicker from "react-datepicker";
import FormattedTime from "@/components/FormattedTime";

export function DateSelector({ date, onChange, minDate, maxDate, placeholder = "Not set", testID }) {
  const [open, setOpen] = React.useState(false);

  const onChangeDate = React.useCallback((date: Date) => {
    setOpen(false);
    onChange(date);
  }, []);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <div
          className="bg-surface-dimmed hover:bg-surface-accent border border-surface-outline rounded px-2 py-2 relative group cursor-pointer w-full outline-none leading-none"
          onClick={() => setOpen(true)}
          data-test-id={testID}
        >
          {date ? <FormattedTime time={date} format="short-date" /> : placeholder}
        </div>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content className="outline-red-400 border border-surface-outline" align="start">
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
