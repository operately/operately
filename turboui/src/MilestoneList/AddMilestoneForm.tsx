import React, { useRef, useState } from "react";
import { PrimaryButton, SecondaryButton } from "../Button";
import { DateField } from "../DateField";
import { RelativeDayField } from "../RelativeDayField";
import { SwitchToggle } from "../SwitchToggle";
import { TextField } from "../TextField";
import type { MilestoneListVariant } from "./types";

interface AddMilestoneFormProps {
  variant: MilestoneListVariant;
  isOpen: boolean;
  onClose: () => void;
  onCreate: (title: string, due: DateField.ContextualDate | number | null) => Promise<boolean>;
}

export function AddMilestoneForm({ variant, isOpen, onClose, onCreate }: AddMilestoneFormProps) {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState<DateField.ContextualDate | null>(null);
  const [dueOffsetDays, setDueOffsetDays] = useState<number | null>(null);
  const [createMore, setCreateMore] = useState(false);
  const nameInputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  if (!isOpen) return null;

  const resetFields = () => {
    setTitle("");
    setDueDate(null);
    setDueOffsetDays(null);
  };

  const focusNameInput = () => {
    requestAnimationFrame(() => {
      nameInputRef.current?.focus();
      if (nameInputRef.current && "select" in nameInputRef.current) {
        nameInputRef.current.select();
      }
    });
  };

  const handleSubmit = async (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!title.trim()) return;

    const due = variant === "project" ? dueDate : dueOffsetDays;
    const succeeded = await onCreate(title.trim(), due);
    if (!succeeded) return;

    resetFields();

    if (createMore) {
      focusNameInput();
      return;
    }

    onClose();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    }
  };

  return (
    <form
      data-test-id="add-milestone-form"
      className="rounded-lg border-2 border-dashed border-stroke-base bg-surface-dimmed p-4"
      onSubmit={handleSubmit}
      onKeyDown={handleKeyDown}
    >
      <div className="space-y-3">
        <TextField
          variant="form-field"
          text={title}
          onChange={setTitle}
          placeholder="Milestone name"
          autofocus
          onChangeOnType
          trimBeforeSave
          inputRef={nameInputRef}
          testId="milestone-name"
        />
        {variant === "project" ? (
          <DateField
            date={dueDate}
            onDateSelect={setDueDate}
            placeholder="Set target date"
            testId="new-milestone-due-date"
            calendarOnly
          />
        ) : (
          <RelativeDayField
            value={dueOffsetDays}
            onChange={setDueOffsetDays}
            placeholder="Set relative date"
            testId="new-milestone-due-offset"
          />
        )}
        <div className="flex items-center justify-between gap-4">
          <SwitchToggle testId="add-more-switch" value={createMore} setValue={setCreateMore} label="Create more" />
          <div className="flex-1" />
          <div className="flex gap-2">
            <SecondaryButton size="sm" onClick={onClose} type="button">
              Cancel
            </SecondaryButton>
            <PrimaryButton size="sm" type="submit" disabled={!title.trim()}>
              Add milestone
            </PrimaryButton>
          </div>
        </div>
      </div>
    </form>
  );
}
