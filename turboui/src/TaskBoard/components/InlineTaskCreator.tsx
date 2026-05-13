import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import * as Types from "../types";
import { PrimaryButton } from "../../Button";

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
  ({ milestone, onCreate, onRequestAdvanced, onCancel, placeholder = "Task name", testId, autoFocus }, ref) => {
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
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            ref={inputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            aria-label="Add task"
            data-test-id={testId || "inline-task-title"}
            className="w-full rounded-md border border-surface-outline bg-transparent px-2 py-2 text-base outline-none focus:border-indigo-500 sm:flex-1 sm:py-1 sm:text-sm"
          />

          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
            <PrimaryButton size="xs" disabled={!title.trim()} onClick={submit} className="w-full sm:w-auto">
              Add
            </PrimaryButton>
            <button
              type="button"
              className="w-full rounded-md px-2.5 py-1 text-sm font-semibold text-content-dimmed transition hover:bg-surface-dimmed hover:text-content-base sm:w-auto"
              onClick={() => {
                setTitle("");
                onCancel?.();
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  },
);

InlineTaskCreator.displayName = "InlineTaskCreator";
