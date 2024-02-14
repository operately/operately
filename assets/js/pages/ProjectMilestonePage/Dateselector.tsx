import React from "react";
import classnames from "classnames";

import * as Popover from "@radix-ui/react-popover";
import DatePicker from "react-datepicker";
import FormattedTime from "@/components/FormattedTime";
import { ButtonLink } from "@/components/Link";

export function DateSelector({ date, onChange, minDate, maxDate, placeholder = "Not set", testID }) {
  const [open, setOpen] = React.useState(false);

  const onChangeDate = React.useCallback((date: Date) => {
    setOpen(false);
    onChange(date);
  }, []);

  const onLabelClick = React.useCallback(() => {
    setOpen(true);
  }, []);

  const className = classnames("flex items-center gap-1");

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <div className={className} onClick={onLabelClick} data-test-id={testID}>
          <div className="font-medium text-content-accent leading-none">
            <FormattedTime time={date} format="short-date-with-weekday" />
          </div>
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
