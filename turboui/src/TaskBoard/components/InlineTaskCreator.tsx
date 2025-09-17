import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import * as Types from "../types";
import { PrimaryButton, SecondaryButton } from "../../Button";

export interface InlineTaskCreatorProps {
  milestone: Types.Milestone | null;
  onCreate: (task: Types.NewTaskPayload) => void;
  onRequestAdvanced?: () => void;
  onCancel?: () => void;
  placeholder?: string;
  testId?: string;
  autoFocus?: boolean;
}

export interface InlineTaskCreatorHandle {
  focus: () => void;
}

export const InlineTaskCreator = forwardRef<InlineTaskCreatorHandle, InlineTaskCreatorProps>(
  ({ milestone, onCreate, onRequestAdvanced, onCancel, placeholder = "Add a task...", testId, autoFocus }, ref) => {
    const [title, setTitle] = useState("");
    const inputRef = useRef<HTMLInputElement | null>(null);

    useImperativeHandle(ref, () => ({
      focus: () => {
        inputRef.current?.focus();
      },
    }));

    useEffect(() => {
      if (autoFocus) inputRef.current?.focus();
    }, [autoFocus]);

    const submit = () => {
      const trimmed = title.trim();
      if (!trimmed) return;

      const payload: Types.NewTaskPayload = {
        title: trimmed,
        milestone,
        dueDate: null,
        assignee: null,
      };

      onCreate(payload);
      // Clear and keep focus for rapid entry
      setTitle("");
      inputRef.current?.focus();
    };

    const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        if (e.shiftKey) {
          onRequestAdvanced?.();
        } else {
          e.preventDefault();
          submit();
        }
      } else if (e.key === "Escape") {
        setTitle("");
        (e.target as HTMLInputElement)?.blur();
        onCancel?.();
      }
    };

    return (
      <div className="px-4 py-2.5 bg-surface-base">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            aria-label="Add task"
            data-test-id={testId || "inline-task-title"}
            className="flex-1 rounded-md border border-surface-outline bg-transparent px-2 py-1 text-sm outline-none focus:border-indigo-500"
          />

          <PrimaryButton size="xs" disabled={!title.trim()} onClick={submit}>
            Add
          </PrimaryButton>
          <SecondaryButton
            size="xs"
            onClick={() => {
              setTitle("");
              onCancel?.();
            }}
          >
            Cancel
          </SecondaryButton>
        </div>
      </div>
    );
  },
);

InlineTaskCreator.displayName = "InlineTaskCreator";
