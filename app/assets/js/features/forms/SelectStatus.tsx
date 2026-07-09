import React from "react";

import classNames from "classnames";
import * as Popover from "@radix-ui/react-popover";
import { Forms, IconChevronDown } from "turboui";

import * as People from "@/models/people";
import { Status, Placeholder, StatusOptions } from "@/components/status";

interface Props {
  field: string;
  options: StatusOptions[];
  reviewer?: People.Person;
  label?: string;
}

export function SelectStatus({ field, options, reviewer, label }: Props) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [open, setOpen] = React.useState(false);
  const [width, setWidth] = React.useState(0);

  const [value, setValue] = Forms.useFieldValue<StatusOptions | null>(field);
  const error = Forms.useFieldError(field);

  const testId = "status-dropdown";

  React.useEffect(() => {
    if (ref.current) setWidth(ref.current.clientWidth);
  }, [ref.current]);

  const triggerClassName = classNames(
    "flex justify-between items-center border border-surface-outline w-full rounded cursor-pointer",
    {
      "border-red-500": error,
    },
  );
  const dropdownClassName = classNames(
    "border border-surface-outline mt-1 bg-surface-base z-[100] divide-y divide-stroke-base rounded shadow-lg overflow-hidden",
  );

  const handleSelected = (status: StatusOptions) => () => {
    setValue(status);
    setOpen(false);
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Forms.InputField field={field} error={error}>
        {label && <label className="font-bold">{label}</label>}

        <Popover.Trigger asChild>
          <div className={triggerClassName} ref={ref} data-test-id={testId}>
            <StatusOrPlaceholder status={value ?? null} reviewer={reviewer} />

            <div className="p-4">
              <IconChevronDown size={24} />
            </div>
          </div>
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Content className={dropdownClassName} align="start" style={{ width }}>
            {options.map((status) => (
              <Status
                key={status}
                status={status}
                selectable
                reviewer={reviewer}
                onSelected={handleSelected(status)}
                testId={`status-dropdown-${status}`}
              />
            ))}
          </Popover.Content>
        </Popover.Portal>
      </Forms.InputField>
    </Popover.Root>
  );
}

function StatusOrPlaceholder({ status, reviewer }: { status: StatusOptions | null; reviewer?: People.Person }) {
  if (status) return <Status status={status} reviewer={reviewer} />;

  return <Placeholder />;
}
