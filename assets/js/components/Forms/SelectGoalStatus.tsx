import React from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

import classNames from "classnames";
import { IconCheck } from "@tabler/icons-react";
import { Circle } from "@/components/Circle";
import { InputField } from "./FieldGroup";
import { useFieldValue, useFieldError } from "./FormContext";
import { useValidation } from "./validations/hook";
import { AddErrorFn } from "./useForm/errors";
import { createTestId } from "@/utils/testid";

type Status = "pending" | "on_track" | "concern" | "issue";
type LegacyStatus = "caution";

type AnyStatus = Status | LegacyStatus;

const STATUS_OPTIONS = ["pending", "on_track", "concern", "issue"] as const;

const LEGACY_STATUS_MAP: Record<LegacyStatus, Status> = {
  caution: "concern",
};

const STATUS_COLORS: Record<AnyStatus, string> = {
  pending: "bg-stone-500",
  on_track: "bg-accent-1",
  concern: "bg-yellow-500",
  caution: "bg-yellow-500",
  issue: "bg-red-500",
};

const STATUS_LABELS: Record<AnyStatus, string> = {
  pending: "Pending",
  on_track: "On track",
  concern: "Needs attention",
  caution: "Needs attention",
  issue: "At risk",
};

const STATUS_DESCRIPTIONS_TEMPLATE = (reviewer: string) => ({
  pending: "Work has not started yet.",
  on_track: "Progressing well. No blockers.",
  concern: `There are emerging risks. ${reviewer} should be aware.`,
  issue: `Blocked or significantly behind. ${reviewer}'s help is needed.`,
});

interface SelectGoalStatusProps {
  field: string;
  reviewerFirstName?: string;

  label?: string;
  hidden?: boolean;
  required?: boolean;
  noReviewer?: boolean;
  readonly?: boolean;
}

const DEFAULT_PROPS = {
  required: true,
  noReviewer: false,
};

export function SelectGoalStatus(props: SelectGoalStatusProps) {
  props = { ...DEFAULT_PROPS, ...props };

  const [value, setValue] = useFieldValue(props.field);
  const error = useFieldError(props.field);

  assertValidStatus(value);
  assertReviewer(props.reviewerFirstName, props.noReviewer);

  const normalizedValue = normalizeStatus(value);
  const reviewer = props.noReviewer ? "Reviewer" : props.reviewerFirstName;

  useValidation(props.field, validateStatus(props.required));

  return (
    <InputField field={props.field} label={props.label} error={error} hidden={props.hidden}>
      {props.readonly ? (
        <StatusValue value={value} readonly />
      ) : (
        <SelectDropdown
          value={normalizedValue}
          rawValue={value}
          setValue={setValue}
          reviewerFirstName={reviewer}
          error={!!error}
        />
      )}
    </InputField>
  );
}

type StatusPickerProps = {
  value: Status | null;
  rawValue: AnyStatus;
  setValue: (value: Status) => void;
  reviewerFirstName: string;
  error: boolean;
};

function SelectDropdown({ value, rawValue, setValue, reviewerFirstName, error }: StatusPickerProps) {
  const trigger = <StatusValue value={rawValue} error={error} />;

  const content = (
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

  return <OptionsMenu trigger={trigger} content={content} />;
}

const menuContentClass = classNames(
  "relative rounded-md mt-1 z-10 px-1 py-1.5",
  "shadow-xl ring-1 transition ring-surface-outline",
  "focus:outline-none",
  "bg-surface-base",
  "animateMenuSlideDown",
);

function OptionsMenu({ trigger, content }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>{trigger}</DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content className={menuContentClass} align="start">
          {content}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
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

function StatusValue({ value, readonly, error }: { value: AnyStatus | null; readonly?: boolean; error?: boolean }) {
  const className = classNames(
    "border shadow-sm bg-surface-dimmed text-sm rounded-lg px-2 py-1.5 relative overflow-hidden group",
    {
      "cursor-pointer": !readonly,
      "border-stroke-base": !error,
      "border-red-500": error,
    },
  );

  return (
    <div className="w-48" data-test-id="status-dropdown">
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

  if (value in LEGACY_STATUS_MAP) {
    return LEGACY_STATUS_MAP[value as LegacyStatus];
  }

  throw new Error(`Invalid status value: ${value}`);
}

function assertValidStatus(value: string | null): asserts value is AnyStatus | null {
  if (value === null) return;

  if (STATUS_OPTIONS.includes(value as Status) || value in LEGACY_STATUS_MAP) {
    return;
  }

  throw new Error(`Invalid status value: ${value}`);
}

function assertReviewer(reviewer: string | undefined, noReviewer: boolean | undefined): asserts reviewer is string {
  if (noReviewer) {
    if (reviewer !== undefined) {
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
