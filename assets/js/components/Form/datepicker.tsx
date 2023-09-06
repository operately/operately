import React from "react";

import DatePicker from "react-datepicker";
import * as Popover from "@radix-ui/react-popover";
import * as Icons from "@tabler/icons-react";

import FormattedTime from "@/components/FormattedTime";

interface DatepickerProps {
  label?: string;
  placeholder?: string;
  selected: Date | null;
  onChange: (date: Date | null) => void;
}

export function Datepicker({ label, placeholder, selected, onChange }: DatepickerProps) {
  const [open, setOpen] = React.useState(false);

  const handleChange = (date: Date | null) => {
    onChange(date);
    setOpen(false);
  };

  return (
    <div className="flex-1">
      {label && <label className="font-bold mb-1 block">{label}</label>}

      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <div className="w-full bg-shade-3 text-white-1 placeholder-white-2 border-none rounded-lg px-3 py-1.5 flex items-center gap-2">
            <Icons.IconCalendar size={20} className="text-white-1/60" />
            {selected ? (
              <FormattedTime time={selected} format="short-date" />
            ) : (
              <span className="text-white-2">{placeholder}</span>
            )}
          </div>
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Content sideOffset={5} align="start" className="border border-dark-8 z-[1000] rounded-lg">
            <div>
              <DatePicker inline selected={selected} onChange={handleChange} />
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}
