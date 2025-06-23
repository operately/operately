import * as Popover from "@radix-ui/react-popover";
import { IconCalendarEvent, IconCalendarPlus, IconX } from "@tabler/icons-react";
import React, { useState } from "react";
import ReactDatePicker from "react-datepicker";
import { SecondaryButton } from "../Button";
import { createTestId } from "../TestableElement";
import classNames from "../utils/classnames";
import { isCurrentYear, isOverdue } from "../utils/time";

export namespace DateField {
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
    showIcon?: boolean;
    emptyStateText?: string;
    emptyStateReadonlyText?: string;

    variant?: "inline" | "form-field";
    testId?: string;
  }
}

export function DateField({
  date,
  setDate = () => {},
  readonly = false,
  iconSize = 18,
  textSize = "text-sm",
  variant = "inline",
  className = "",
  showOverdueWarning = true,
  showEmptyStateAsButton = false,
  showIcon = true,
  emptyStateText = "Set date",
  emptyStateReadonlyText = "No date set",
  testId = "date-field",
}: DateField.Props) {
  const [isOpen, setIsOpen] = useState(false);

  const handleChange = (newDate: Date | null) => {
    if (date?.getTime() !== newDate?.getTime()) {
      setDate(newDate);
      setIsOpen(false); // Close popover after date selection
    }
  };

  const clearDate = () => {
    handleChange(null);
    setIsOpen(false);
  };

  useExportedTestHelper(testId, { setDate: handleChange });

  const triggerClassName = classNames(
    "inline-block focus:outline-none",
    {
      "hover:bg-surface-dimmed rounded-lg px-1.5 py-1 -mx-1.5 -my-1": variant === "inline" && !readonly,
      "border border-surface-outline rounded-lg w-full hover:bg-surface-dimmed px-2 py-1.5": variant === "form-field",
    },
    className,
  );

  return (
    <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
      <Popover.Trigger className={triggerClassName} disabled={readonly} data-test-id={testId}>
        <DateDisplay
          date={date}
          className={className}
          readonly={readonly}
          showOverdueWarning={showOverdueWarning}
          showEmptyStateAsButton={showEmptyStateAsButton}
          showIcon={showIcon}
          emptyStateText={emptyStateText}
          emptyStateReadonlyText={emptyStateReadonlyText}
          iconSize={iconSize}
          textSize={textSize}
          variant={variant}
        />
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          className="bg-surface-base shadow-lg border border-surface-outline rounded-md z-50"
          sideOffset={5}
        >
          <div className="flex justify-between items-center border-b border-stroken-base p-2 pb-1.5">
            <div className="text-sm font-medium">Select date</div>
            {date && <ClearButton clearDate={clearDate} testId={testId} />}
          </div>

          <div className="p-2 pt-1" data-test-id={createTestId(testId, "datepicker")}>
            <ReactDatePicker selected={date || undefined} onChange={handleChange} inline />
          </div>

          <Popover.Arrow />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function ClearButton({ clearDate, testId }: { clearDate: () => void; testId: string }) {
  return (
    <button
      onClick={clearDate}
      className="flex items-center text-xs text-content-subtle px-2 py-1 rounded hover:bg-surface-dimmed"
      data-test-id={createTestId(testId, "clear")}
    >
      <IconX size={14} className="mr-1" />
      Clear
    </button>
  );
}

interface DateDisplayProps {
  date: Date | null | undefined;
  className: string;
  readonly: boolean;

  iconSize: number;
  textSize: string;

  showOverdueWarning: boolean;
  showEmptyStateAsButton: boolean;
  showIcon: boolean;

  emptyStateText: string;
  emptyStateReadonlyText: string;

  variant?: "inline" | "form-field";
}

function DateDisplay(props: DateDisplayProps) {
  if (!props.date && props.showEmptyStateAsButton && props.readonly) {
    return <EmptyStateButton emptyStateText={props.emptyStateText} readonly={props.readonly} variant={props.variant} />;
  }

  const iconSize = props.iconSize;
  const textSize = props.textSize;
  const isDateOverdue = props.date && isOverdue(props.date);
  const variant = props.variant || "inline";

  const elemClass = classNames(
    {
      "flex items-center": true,
      "gap-1.5": props.showIcon,
      "text-content-error": isDateOverdue && props.showOverdueWarning,
      "text-content-dimmed": !props.date,
      "w-full": variant === "form-field",
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
    <span className={elemClass}>
      {props.showIcon && <IconCalendarEvent size={iconSize} className="-mt-[1px]" />}
      <span>{text}</span>
    </span>
  );
}

function EmptyStateButton({
  readonly,
  emptyStateText,
  variant,
}: {
  readonly: boolean;
  emptyStateText: string;
  variant?: "inline" | "form-field";
}) {
  if (readonly) {
    return null;
  } else {
    // If it's a form-field variant, we'll add padding to make it look like a form field
    const containerClass = classNames({
      "text-content-subtle": true,
      "p-1.5": variant === "form-field",
      "w-full": variant === "form-field",
    });

    // For form-field variant, wrap the button in a container that takes full width
    return (
      <div className={containerClass}>
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

//
// This function allows tests to set the date programmatically
// It uses useImperativeHandle to expose a method that can be called from tests
//
// To use this in tests, you would do something this:
//
// window.__tests.components["<testId>"].setDateFromTests(new Date("2023-10-01"));
//

function useExportedTestHelper(testId: string, api: any) {
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      window.__tests = window.__tests || {};
      window.__tests.components = window.__tests.components || {};
      window.__tests.components[testId] = api;
    }

    return () => {
      if (window.__tests && window.__tests.components && window.__tests.components[testId]) {
        delete window.__tests.components[testId];
      }
    };
  }, [testId]);
}
