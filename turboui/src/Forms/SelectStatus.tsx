import * as React from "react";
import * as Popover from "@radix-ui/react-popover";

import { IconChevronDown } from "../icons";
import { COLORS, TITLES, CIRCLE_BORDER_COLORS, CIRCLE_BACKGROUND_COLORS } from "../SmallStatusIndicator";
import classNames from "../utils/classnames";
import { useFieldError, useFieldValue } from "./context";
import { InputField } from "./FieldGroup";
import type { SelectStatusOption, SelectStatusProps } from "./types";

export function SelectStatus({ field, options, reviewer, label }: SelectStatusProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [open, setOpen] = React.useState(false);
  const [width, setWidth] = React.useState(0);

  const [value, setValue] = useFieldValue<SelectStatusOption | null>(field);
  const error = useFieldError(field);

  React.useEffect(() => {
    if (ref.current) setWidth(ref.current.clientWidth);
  }, []);

  const triggerClassName = classNames(
    "flex justify-between items-center border border-surface-outline w-full rounded cursor-pointer",
    {
      "border-red-500": error,
    },
  );
  const dropdownClassName = classNames(
    "border border-surface-outline mt-1 bg-surface-base z-[100] divide-y divide-stroke-base rounded shadow-lg overflow-hidden",
  );

  const handleSelected = (status: SelectStatusOption) => () => {
    setValue(status);
    setOpen(false);
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <InputField field={field} error={error}>
        {label && <label className="font-bold">{label}</label>}

        <Popover.Trigger asChild>
          <div className={triggerClassName} ref={ref} data-test-id="status-dropdown">
            <StatusOrPlaceholder status={value ?? null} reviewer={reviewer} />

            <div className="p-4">
              <IconChevronDown size={24} />
            </div>
          </div>
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Content className={dropdownClassName} align="start" style={{ width }}>
            {options.map((status) => (
              <StatusOption
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
      </InputField>
    </Popover.Root>
  );
}

function StatusOrPlaceholder({
  status,
  reviewer,
}: {
  status: SelectStatusOption | null;
  reviewer?: SelectStatusProps["reviewer"];
}) {
  if (status) return <StatusOption status={status} reviewer={reviewer} />;

  return <Placeholder />;
}

function StatusOption({
  status,
  reviewer,
  selectable,
  onSelected,
  testId,
}: {
  status: SelectStatusOption;
  reviewer?: SelectStatusProps["reviewer"];
  selectable?: boolean;
  onSelected?: () => void;
  testId?: string;
}) {
  const color = COLORS[status];
  const title = TITLES[status];

  const className = classNames("flex items-center gap-2 p-2", {
    "hover:bg-surface-highlight cursor-pointer": selectable,
  });

  return (
    <div className={className} onClick={onSelected} data-test-id={testId}>
      <div>
        <Circle color={color} />
      </div>

      <div>
        <p className="font-bold">{title}</p>
        <div className="text-sm">
          <StatusDescription status={status} reviewer={reviewer} />
        </div>
      </div>
    </div>
  );
}

function Placeholder() {
  return (
    <div className="flex items-center gap-2 p-2 text-content-dimmed">
      <div className="w-10 h-10 rounded-full border-2 border-surface-outline border-dashed" />

      <div>
        <p className="font-semibold">Select a status</p>
        <div className="text-sm">Choose from the available options</div>
      </div>
    </div>
  );
}

function StatusDescription({
  status,
  reviewer,
}: {
  status: SelectStatusOption;
  reviewer?: SelectStatusProps["reviewer"];
}) {
  const reviewerName = reviewer?.fullName?.split(" ")[0];

  switch (status) {
    case "on_track":
      return <>Progressing as planned. No blockers.</>;
    case "caution":
      return <>Emerging risks or delays. {reviewerName || "The reviewer"} should be aware.</>;
    case "off_track":
      return <>Significant problems affecting success. {reviewerName || "The reviewer"}’s help is needed.</>;
    case "pending":
      return <>Work hasn't started yet.</>;
    default:
      throw new Error(`Unknown status: ${status}`);
  }
}

function Circle({ color }: { color: (typeof COLORS)[SelectStatusOption] }) {
  const borderColor = CIRCLE_BORDER_COLORS[color];
  const backgroundColor = CIRCLE_BACKGROUND_COLORS[color];

  const outerClassName = classNames(
    "w-10 h-10",
    "rounded-full",
    "flex items-center justify-center",
    "border-2",
    "p-0.5",
    borderColor,
  );
  const innerClassName = classNames("w-full h-full", "rounded-full", backgroundColor);

  return (
    <div className={outerClassName}>
      <div className={innerClassName}></div>
    </div>
  );
}
