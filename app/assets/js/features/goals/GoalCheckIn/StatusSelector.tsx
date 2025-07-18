import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as React from "react";

import { Circle } from "@/components/Circle";
import { useFieldError, useFieldValue } from "@/components/Forms/FormContext";
import { AddErrorFn } from "@/components/Forms/useForm/errors";
import { useValidation } from "@/components/Forms/validations/hook";
import { createTestId } from "@/utils/testid";
import { IconCheck } from "turboui";
import classNames from "classnames";

type Status = "on_track" | "caution" | "off_track";

const STATUS_OPTIONS = ["on_track", "caution", "off_track"] as const;

const STATUS_COLORS: Record<Status, string> = {
  on_track: "bg-accent-1",
  caution: "bg-yellow-500",
  off_track: "bg-red-500",
};

const STATUS_LABELS: Record<Status, string> = {
  on_track: "On track",
  caution: "Caution",
  off_track: "Off track",
};

const STATUS_DESCRIPTIONS_TEMPLATE = (reviewer: string) => ({
  on_track: "Progressing as planned. No blockers.",
  caution: `Emerging risks or delays. ${reviewer} should be aware.`,
  off_track: `Significant problems affecting success. ${reviewer}'s help is needed.`,
});

interface SelectGoalStatusProps {
  field: string;
  reviewerFirstName?: string;

  required?: boolean;
  noReviewer?: boolean;
}

const DEFAULT_PROPS = {
  required: true,
  noReviewer: false,
};

export function StatusSelector(props: SelectGoalStatusProps) {
  props = { ...DEFAULT_PROPS, ...props };

  const [value, setValue] = useFieldValue(props.field);
  const error = useFieldError(props.field);

  assertValidStatus(value);
  assertReviewer(props.reviewerFirstName, props.noReviewer);

  const normalizedValue = normalizeStatus(value);
  const reviewer = props.noReviewer ? "Reviewer" : props.reviewerFirstName;

  useValidation(props.field, validateStatus(props.required));

  return (
    <div>
      <SelectDropdown
        value={normalizedValue}
        rawValue={value}
        setValue={setValue}
        reviewerFirstName={reviewer}
        error={!!error}
      />
      {error && <div className="text-red-500 text-xs">{error}</div>}
    </div>
  );
}

type StatusPickerProps = {
  value: Status | null;
  rawValue: Status;
  setValue: (value: Status) => void;
  reviewerFirstName: string;
  error: boolean;
};

function SelectDropdown({ value, rawValue, setValue, reviewerFirstName, error }: StatusPickerProps) {
  const trigger = <StatusTrigger value={rawValue} error={error} />;
  const content = <StatusOptions value={value} setValue={setValue} reviewerFirstName={reviewerFirstName} />;

  return <OptionsMenu trigger={trigger} content={content} />;
}

function StatusOptions({ value, setValue, reviewerFirstName }) {
  return (
    <div>
      {STATUS_OPTIONS.map((status, idx) => (
        <StatusPickerOption
          testId={createTestId("status-option", STATUS_LABELS[status])}
          key={idx}
          status={STATUS_LABELS[status]}
          color={STATUS_COLORS[status]}
          description={STATUS_DESCRIPTIONS_TEMPLATE(reviewerFirstName)[status]}
          isSelected={value === status}
          onClick={() => setValue(status)}
        />
      ))}
    </div>
  );
}

function StatusPickerOption({ status, description, color, isSelected, onClick, testId }) {
  return (
    <DropdownMenu.Item asChild>
      <div
        className="px-3 py-1.5 hover:bg-surface-highlight cursor-pointer rounded"
        onClick={onClick}
        data-test-id={testId}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Circle size={20} color={color} />

            <div>
              <div className="text-sm font-bold leading-none">{status}</div>
              <div className="text-xs mt-1 leading-none">{description}</div>
            </div>
          </div>

          <div className={isSelected ? "opacity-100" : "opacity-0"}>
            <IconCheck />
          </div>
        </div>
      </div>
    </DropdownMenu.Item>
  );
}

function StatusTrigger({ value, error }: { value: Status | null; error?: boolean }) {
  const className = classNames(
    "border rounded-lg",
    "px-2 py-1.5",
    "text-sm relative overflow-hidden",
    "group",
    "cursor-pointer",
    "hover:bg-surface-dimmed",
    {
      "border-surface-outline": !error,
      "border-red-500": error,
    },
  );

  return (
    <div data-test-id="status-dropdown">
      <div className={className}>
        {value === null ? (
          <div className="flex items-center gap-2">
            <Circle size={18} border="border-surface-outline" noFill borderSize={2} borderDashed />
            <div className="font-medium">Pick a status&hellip;</div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Circle size={18} color={STATUS_COLORS[value]} />
            <div className="font-medium">{STATUS_LABELS[value]}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function normalizeStatus(value: string | null) {
  if (value === null) return null;

  if (STATUS_OPTIONS.includes(value as Status)) {
    return value as Status;
  }

  throw new Error(`Invalid status value: ${value}`);
}

function assertValidStatus(value: string | null): asserts value is Status | null {
  if (value === null) return;

  if (STATUS_OPTIONS.includes(value as Status)) {
    return;
  }

  throw new Error(`Invalid status value: ${value}`);
}

function assertReviewer(reviewer: string | undefined, noReviewer: boolean | undefined): asserts reviewer is string {
  if (noReviewer) {
    if (![undefined, ""].includes(reviewer)) {
      throw new Error("Reviewer should not be set is noReviewer is true");
    }

    return;
  } else {
    if (typeof reviewer !== "string") {
      throw new Error("Reviewer should be a string");
    }

    if (reviewer.trim() === "") {
      throw new Error("Reviewer should not be empty");
    }

    if (reviewer.split(" ").length !== 1) {
      throw new Error("Reviewer should be a single word, the first name only");
    }
  }
}

function validateStatus(required?: boolean) {
  return (field: string, value: string, addError: AddErrorFn) => {
    if (required && !STATUS_OPTIONS.includes(value as Status)) {
      return addError(field, `Status is required`);
    }
  };
}

const menuContentClass = classNames(
  "max-w-[100vw]", // on mobile screens, the dropdown should be full width
  "relative",
  "sm:rounded-md mt-1 z-50 px-1 py-1.5",
  "shadow-xl ring-1 transition ring-surface-outline",
  "focus:outline-none",
  "bg-surface-base",
  "animateMenuSlideDown",
);

function OptionsMenu({ trigger, content }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className="w-full">{trigger}</DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content className={menuContentClass} align="start">
          {content}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
