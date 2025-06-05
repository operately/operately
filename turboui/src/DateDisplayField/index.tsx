import * as Popover from "@radix-ui/react-popover";
import { IconCalendarEvent, IconCalendarPlus, IconX } from "@tabler/icons-react";
import React, { useState } from "react";
import ReactDatePicker from "react-datepicker";
import { SecondaryButton } from "../Button";
import classNames from "../utils/classnames";
import { isCurrentYear, isOverdue } from "../utils/time";

export namespace DateDisplayField {
  export interface Props {
    date: Date | null;
    setDate?: (date: Date | null) => void;

    placeholder?: string;
    readonly?: boolean;
    className?: string;
    iconSize?: number;
    textSize?: string;

    showOverdueWarning?: boolean;
    showEmptyStateAsButton?: boolean;
    emptyStateText?: string;
    emptyStateReadonlyText?: string;
  }
}

export function DateDisplayField({
  date,
  setDate = () => {},
  readonly = false,
  iconSize = 18,
  textSize = "text-sm",
  className = "",
  showOverdueWarning = true,
  showEmptyStateAsButton = false,
  emptyStateText = "Set date",
  emptyStateReadonlyText = "No date set",
}: DateDisplayField.Props) {
  const [isOpen, setIsOpen] = useState(false);

  const handleChange = (newDate: Date | null) => {
    if (date?.getTime() !== newDate?.getTime()) {
      setDate(newDate);
    }
  };

  const clearDate = () => {
    handleChange(null);
    setIsOpen(false);
  };

  const display = (
    <DateDisplay
      date={date}
      className={className}
      readonly={readonly}
      showOverdueWarning={showOverdueWarning}
      showEmptyStateAsButton={showEmptyStateAsButton}
      emptyStateText={emptyStateText}
      emptyStateReadonlyText={emptyStateReadonlyText}
      iconSize={iconSize}
      textSize={textSize}
    />
  );

  if (readonly) {
    return display;
  } else {
    return (
      <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
        <Popover.Trigger className={`inline-block ${className}`}>{display}</Popover.Trigger>
        <Popover.Portal>
          <DatePickerPopover date={date} setNewDate={handleChange} clearDate={clearDate} />
        </Popover.Portal>
      </Popover.Root>
    );
  }
}

const DatePickerPopover = ({
  date,
  clearDate,
  setNewDate,
}: {
  date?: Date | null;
  clearDate: () => void;
  setNewDate: (date: Date | null) => void;
}) => (
  <Popover.Content className="bg-surface-base shadow-lg border border-surface-outline rounded-md z-50" sideOffset={5}>
    <div className="flex justify-between items-center border-b border-stroken-base p-2 pb-1.5">
      <div className="text-sm font-medium">Select date</div>
      {date && (
        <button
          onClick={clearDate}
          className="flex items-center text-xs text-content-subtle px-2 py-1 rounded hover:bg-surface-dimmed"
        >
          <IconX size={14} className="mr-1" />
          Clear
        </button>
      )}
    </div>

    <div className="p-2 pt-1">
      <ReactDatePicker selected={date || undefined} onChange={setNewDate} inline />
    </div>

    <Popover.Arrow />
  </Popover.Content>
);

interface DateDisplayProps {
  date: Date | null | undefined;
  className: string;
  readonly: boolean;

  iconSize: number;
  textSize: string;

  showOverdueWarning: boolean;
  showEmptyStateAsButton: boolean;

  emptyStateText: string;
  emptyStateReadonlyText: string;
}

function DateDisplay(props: DateDisplayProps) {
  if (!props.date && props.showEmptyStateAsButton) {
    return <EmptyStateButton emptyStateText={props.emptyStateText} readonly={props.readonly} />;
  }

  const iconSize = props.iconSize;
  const textSize = props.textSize;
  const Elem = props.readonly ? "span" : "button";
  const isDateOverdue = props.date && isOverdue(props.date);

  const elemClass = classNames(
    {
      "flex items-center gap-1.5": true,
      "focus:outline-none hover:bg-surface-dimmed px-1.5 py-1 -my-1 -mx-1.5 rounded": !props.readonly,
      "text-content-error": isDateOverdue && props.showOverdueWarning,
      "text-content-dimmed": !props.date,
    },
    textSize,
    props.className,
  );

  let text = "";
  if (props.date) {
    text = formatDate(props.date);
  } else if (props.readonly) {
    text = props.emptyStateReadonlyText;
  } else {
    text = props.emptyStateText;
  }

  return (
    <Elem className={elemClass}>
      <IconCalendarEvent size={iconSize} className="-mt-[1px]" />
      <span>{text}</span>
    </Elem>
  );
}

function EmptyStateButton({ readonly, emptyStateText }: { readonly: boolean; emptyStateText: string }) {
  if (readonly) {
    return null;
  } else {
    return (
      <div className="text-content-subtle">
        <SecondaryButton size="xs" icon={IconCalendarPlus}>
          {emptyStateText}
        </SecondaryButton>
      </div>
    );
  }
}

const formatDate = (date: Date) => {
  if (isCurrentYear(date)) {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } else {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }
};
