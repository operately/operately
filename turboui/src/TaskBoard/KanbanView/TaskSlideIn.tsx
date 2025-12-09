import React, { useMemo, useState, useCallback, useEffect } from "react";
import { SlideIn } from "../../SlideIn";
import { Task, Milestone } from "../types";
import { DateField } from "../../DateField";
import { PersonField } from "../../PersonField";
import { MilestoneField } from "../../MilestoneField";
import { StatusSelector } from "../../StatusSelector";
import RichContent, { countCharacters, isContentEmpty, shortenContent } from "../../RichContent";
import { Editor, useEditor } from "../../RichEditor";
import type { RichEditorHandlers } from "../../RichEditor/useEditor";
import { DangerButton, PrimaryButton, SecondaryButton } from "../../Button";
import { IconExternalLink, IconTrash } from "../../icons";
import { BlackLink } from "../../Link";

interface TaskSlideInProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onAssigneeChange?: (taskId: string, assignee: any) => void;
  onDueDateChange?: (taskId: string, dueDate: any) => void;
  onMilestoneChange?: (taskId: string, milestone: Milestone | null) => void;
  onNameChange?: (taskId: string, name: string) => void;
  onStatusChange?: (taskId: string, status: any) => void;
  onDescriptionChange?: (taskId: string, description: any) => Promise<boolean>;
  onDelete?: (taskId: string) => void | Promise<void>;
  assigneePersonSearch?: any;
  statuses: StatusSelector.StatusOption[];
  milestones?: Milestone[];
  onMilestoneSearch?: (query: string) => Promise<void>;
  richTextHandlers?: RichEditorHandlers;
}

export function TaskSlideIn({
  isOpen,
  onClose,
  task,
  onAssigneeChange,
  onDueDateChange,
  onMilestoneChange,
  onNameChange,
  onStatusChange,
  onDescriptionChange,
  onDelete,
  assigneePersonSearch,
  statuses,
  milestones = [],
  onMilestoneSearch,
  richTextHandlers,
}: TaskSlideInProps) {
  const descriptionContent = useMemo(() => {
    if (!task?.description) return null;
    try {
      return JSON.parse(task.description);
    } catch (e) {
      return null;
    }
  }, [task?.description]);

  if (!task) return null;

  return (
    <SlideIn
      isOpen={isOpen}
      onClose={onClose}
      width="650px"
      testId="task-slide-in"
    >
      <div className="relative flex min-h-full flex-col gap-8 px-6 py-6">
        <TitleSection task={task} onNameChange={onNameChange} />

        <div className="grid grid-cols-2 gap-x-8 gap-y-6">
          <Field label="Status">
            <StatusSelector
              status={task.status ?? statuses[0]!}
              statusOptions={statuses}
              onChange={(newStatus) => onStatusChange?.(task.id, newStatus)}
              readonly={!onStatusChange}
              size="sm"
              showFullBadge={true}
            />
          </Field>

          <Field label="Assignee">
            <PersonField
              person={task.assignees?.[0] || null}
              setPerson={(p) => onAssigneeChange?.(task.id, p)}
              searchData={assigneePersonSearch}
              readonly={!onAssigneeChange}
            />
          </Field>

          <Field label="Due Date">
            <DateField
              date={task.dueDate}
              onDateSelect={(d) => onDueDateChange?.(task.id, d)}
              showOverdueWarning={!task.status?.closed}
              readonly={!onDueDateChange}
            />
          </Field>

          <Field label="Milestone">
            <MilestoneField
              milestone={task.milestone}
              setMilestone={(m) => onMilestoneChange?.(task.id, m as Milestone | null)}
              readonly={!onMilestoneChange}
              milestones={milestones}
              onSearch={onMilestoneSearch ?? (async () => {})}
            />
          </Field>
        </div>

        <DescriptionSection
          taskId={task.id}
          description={descriptionContent}
          onDescriptionChange={onDescriptionChange}
          richTextHandlers={richTextHandlers}
        />

        <TaskDeleteSection task={task} isOpen={isOpen} onDelete={onDelete} />
      </div>
    </SlideIn>
  );
}

interface TaskDeleteSectionProps {
  task: Task;
  isOpen: boolean;
  onDelete?: (taskId: string) => void | Promise<void>;
}

function TaskDeleteSection({ task, isOpen, onDelete }: TaskDeleteSectionProps) {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  useEffect(() => {
    setIsConfirmingDelete(false);
  }, [task.id, isOpen]);

  if (!onDelete) return null;

  const handleDeleteClick = () => {
    setIsConfirmingDelete(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await onDelete(task.id);
    } finally {
      setIsConfirmingDelete(false);
    }
  };

  const handleCancelDelete = () => setIsConfirmingDelete(false);

  const spacerClassName = isConfirmingDelete ? "h-24" : "h-16";

  return (
    <>
      <div className={spacerClassName} />

      {!isConfirmingDelete && (
        <button
          type="button"
          onClick={handleDeleteClick}
          className="absolute bottom-4 right-4 p-2 rounded-full border border-surface-outline bg-surface-base text-red-600 hover:text-red-700 dark:text-red-400 hover:bg-surface-highlight transition-colors shadow-sm"
          aria-label="Delete task"
          title="Delete task"
        >
          <IconTrash size={18} />
        </button>
      )}

      {isConfirmingDelete && (
        <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3 rounded-md border border-surface-outline bg-surface-base shadow-sm px-4 py-3">
          <div className="flex-1 leading-tight">
            <div className="text-sm font-semibold text-content-accent">Delete this task?</div>
            <div className="text-xs text-content-dimmed">This action cannot be undone.</div>
          </div>
          <SecondaryButton size="xs" onClick={handleCancelDelete}>
            Cancel
          </SecondaryButton>
          <DangerButton size="xs" onClick={handleConfirmDelete}>
            Confirm
          </DangerButton>
        </div>
      )}
    </>
  );
}

function Field({
  label,
  children,
  headerAction,
}: {
  label: string;
  children: React.ReactNode;
  headerAction?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5 group">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-content-dimmed uppercase tracking-wider">{label}</label>
        {headerAction && <div className="opacity-0 group-hover:opacity-100 transition-opacity">{headerAction}</div>}
      </div>
      <div className="min-h-[32px] flex items-center">{children}</div>
    </div>
  );
}

interface TitleSectionProps {
  task: Task;
  onNameChange?: (taskId: string, name: string) => void;
}

function TitleSection({ task, onNameChange }: TitleSectionProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");

  const handleStartEditing = () => {
    if (!onNameChange) return;
    setEditedName(task.title);
    setIsEditingName(true);
  };

  const handleCommitChange = () => {
    const trimmed = editedName.trim();

    if (trimmed && trimmed !== task.title) {
      onNameChange?.(task.id, trimmed);
    }

    setIsEditingName(false);
  };

  const handleBlur: React.FocusEventHandler<HTMLInputElement> = () => {
    handleCommitChange();
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") {
      handleCommitChange();
    } else if (e.key === "Escape") {
      setIsEditingName(false);
    }
  };

  return (
    <div className="w-full border-b border-surface-outline pb-4">
      {isEditingName ? (
        <input
          type="text"
          value={editedName}
          onChange={(e) => setEditedName(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          autoFocus
          className="w-full text-2xl font-bold text-content-accent leading-tight bg-transparent border-none outline-none focus:ring-0"
        />
      ) : (
        <div className={onNameChange ? "cursor-text flex items-center gap-2" : "flex items-center gap-2"}>
          <span onClick={handleStartEditing} className="text-2xl font-bold text-content-accent leading-tight">
            {task.title}
          </span>

          {!isEditingName && task.link && (
            <BlackLink to={task.link} underline="hover" className="-mt-6 text-content-dimmed hover:text-content-base">
              <IconExternalLink size={14} />
            </BlackLink>
          )}
        </div>
      )}
    </div>
  );
}

interface DescriptionSectionProps {
  taskId: string;
  description: any;
  onDescriptionChange?: (taskId: string, description: any) => Promise<boolean>;
  richTextHandlers?: RichEditorHandlers;
}

function DescriptionSection({ taskId, description, onDescriptionChange, richTextHandlers }: DescriptionSectionProps) {
  if (!richTextHandlers) {
    return null;
  }

  const initialMode = isContentEmpty(description) ? "zero" : "view";
  const [mode, setMode] = useState<"view" | "edit" | "zero">(initialMode);

  const startEdit = useCallback(() => {
    if (!onDescriptionChange) return;
    setMode("edit");
  }, [onDescriptionChange]);

  const { expandedDescription, length, isExpanded, toggleExpand } = useExpandDescription(description);

  if (mode === "zero") {
    if (!onDescriptionChange) return null;

    return (
      <Field label="Description">
        <button
          type="button"
          onClick={startEdit}
          className="w-full text-left text-sm text-content-dimmed hover:text-content-base transition-colors py-2"
        >
          Add description...
        </button>
      </Field>
    );
  }

  if (mode === "view") {
    return (
      <Field
        label="Description"
        headerAction={
          onDescriptionChange ? (
            <SecondaryButton size="xxs" onClick={startEdit}>
              Edit
            </SecondaryButton>
          ) : undefined
        }
      >
        <div className="text-sm text-content-accent max-h-[calc(100vh-320px)] overflow-auto pr-1 pb-1">
          <RichContent content={expandedDescription} mentionedPersonLookup={richTextHandlers.mentionedPersonLookup} />

          {length > PREVIEW_CHARACTER_LIMIT && (
            <button
              type="button"
              onClick={toggleExpand}
              className="text-content-dimmed hover:underline text-xs mt-1 font-medium"
            >
              {isExpanded ? "Collapse" : "Expand"}
            </button>
          )}
        </div>
      </Field>
    );
  }

  // Edit mode
  return (
    <DescriptionEdit
      taskId={taskId}
      description={description}
      onDescriptionChange={onDescriptionChange}
      richTextHandlers={richTextHandlers}
      onDone={(nextDescription) => {
        if (isContentEmpty(nextDescription)) {
          setMode("zero");
        } else {
          setMode("view");
        }
      }}
      onCancel={() => {
        setMode(isContentEmpty(description) ? "zero" : "view");
      }}
    />
  );
}

interface DescriptionEditProps {
  taskId: string;
  description: any;
  onDescriptionChange?: (taskId: string, description: any) => Promise<boolean>;
  richTextHandlers: RichEditorHandlers;
  onDone: (nextDescription: any) => void;
  onCancel: () => void;
}

function DescriptionEdit({
  taskId,
  description,
  onDescriptionChange,
  richTextHandlers,
  onDone,
  onCancel,
}: DescriptionEditProps) {
  const editor = useEditor({
    content: description,
    editable: true,
    placeholder: "Add description...",
    handlers: richTextHandlers,
    autoFocus: true,
  });

  const save = useCallback(async () => {
    const content = editor.getJson();

    if (!onDescriptionChange) {
      onDone(content);
      return;
    }

    const previous = description;

    onDone(content);

    const success = await onDescriptionChange(taskId, content);

    // If the update fails, revert to previous value
    if (!success) {
      onDone(previous);
    }
  }, [editor, onDescriptionChange, onDone, taskId, description]);

  return (
    <Field label="Description">
      <div className="w-full max-h-[calc(100vh-300px)] overflow-auto pr-1 pb-1">
        <Editor editor={editor} />

        <div className="flex gap-2 mt-2 justify-end">
          <PrimaryButton size="xs" onClick={save}>
            Save
          </PrimaryButton>
          <SecondaryButton size="xs" onClick={onCancel}>
            Cancel
          </SecondaryButton>
        </div>
      </div>
    </Field>
  );
}

const PREVIEW_CHARACTER_LIMIT = 450;

function useExpandDescription(rawDescription: any) {
  const [isExpanded, setIsExpanded] = useState(false);

  const length = useMemo(() => {
    return rawDescription ? countCharacters(rawDescription, { skipParse: true }) : 0;
  }, [rawDescription]);

  const expandedDescription = useMemo(() => {
    if (length <= PREVIEW_CHARACTER_LIMIT || isExpanded) {
      return rawDescription;
    }

    return shortenContent(rawDescription, PREVIEW_CHARACTER_LIMIT, { suffix: "...", skipParse: true });
  }, [rawDescription, length, isExpanded]);

  const toggleExpand = useCallback(() => setIsExpanded((prev) => !prev), []);

  return { expandedDescription, length, isExpanded, toggleExpand };
}
