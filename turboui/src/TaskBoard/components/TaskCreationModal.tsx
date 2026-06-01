import React, { useEffect, useState } from "react";
import { AssigneesField } from "../../AssigneesField";
import { PrimaryButton, SecondaryButton } from "../../Button";
import { DateField } from "../../DateField";
import { MilestoneField } from "../../MilestoneField";
import Modal from "../../Modal";
import { PersonField } from "../../PersonField";
import { SwitchToggle } from "../../SwitchToggle";
import { TextField } from "../../TextField";
import { Editor, useEditor } from "../../RichEditor";
import { isContentEmpty } from "../../RichContent";
import type { RichEditorHandlers } from "../../RichEditor/useEditor";
import * as Types from "../types";

interface TaskCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTask: (task: Types.NewTaskPayload) => void;
  milestones?: Types.Milestone[];
  currentMilestoneId?: string;
  assigneePersonSearch?: PersonField.SearchData;
  onMilestoneSearch: (query: string) => Promise<void>;
  milestoneReadOnly?: boolean;
  richTextHandlers?: RichEditorHandlers;
}

export function TaskCreationModal({
  isOpen,
  onClose,
  onCreateTask,
  milestones = [],
  currentMilestoneId,
  assigneePersonSearch,
  onMilestoneSearch,
  milestoneReadOnly,
  richTextHandlers,
}: TaskCreationModalProps) {
  // Form state
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState<DateField.ContextualDate | null>(null);
  const [assignees, setAssignees] = useState<Types.Person[]>([]);
  const [milestone, setMilestone] = useState<Types.Milestone | null>(null);
  const [description, setDescription] = useState<any>(null);
  const [descriptionEditorKey, setDescriptionEditorKey] = useState(0);
  const [createMore, setCreateMore] = useState(false);

  const disabled = !title.trim();

  // Update milestone when currentMilestoneId changes or modal opens
  useEffect(() => {
    if (isOpen) {
      // Handle special case for "no-milestone"
      if (currentMilestoneId === "no-milestone") {
        setMilestone(null);
      } else if (currentMilestoneId) {
        const selectedMilestone = milestones.find((m) => m.id === currentMilestoneId);
        setMilestone(selectedMilestone || null);
      } else {
        // When adding from main button, clear milestone selection
        setMilestone(null);
      }
    }
  }, [isOpen, currentMilestoneId, milestones]);

  // Reset form after task creation
  const resetForm = () => {
    setTitle("");
    setDueDate(null);
    setAssignees([]);
    setDescription(null);
    setDescriptionEditorKey((key) => key + 1);
    // Keep the milestone selected for creating multiple tasks in same milestone
    // Keep the createMore toggle state
  };

  // Reset form when modal is closed
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Don't submit if title or milestone is empty
    if (disabled) return;

    const newTask: Types.NewTaskPayload = {
      title: title.trim(),
      milestone: milestone,
      dueDate: dueDate || null,
      assignees,
    };

    if (description && !isContentEmpty(description)) {
      newTask.description = description;
    }

    onCreateTask(newTask);

    if (createMore) {
      resetForm();
    } else {
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Task" size="medium">
      <form onSubmit={handleSubmit} className="space-y-6" data-test-id="add-task-form">
        <TextField
          variant="form-field"
          label="Task title"
          text={title}
          onChange={setTitle}
          placeholder="Enter task title"
          autofocus
          testId="task-title"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-content-base mb-1">Due date</label>
            <DateField
              variant="form-field"
              date={dueDate}
              onDateSelect={setDueDate}
              placeholder="Set due date"
              testId="task-due-date"
              calendarOnly
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-content-base mb-1">Assignees</label>
            {assigneePersonSearch ? (
              <AssigneesField
                people={assignees}
                setPeople={setAssignees}
                searchData={assigneePersonSearch}
                emptyStateMessage="Select assignees"
                testId="assignee"
                variant="form-field"
              />
            ) : (
              <AssigneesField
                people={assignees}
                setPeople={setAssignees}
                readonly={true}
                emptyStateMessage="Select assignees"
                testId="assignee"
                variant="form-field"
              />
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-content-base mb-1">Milestone</label>
          <div className="min-w-0 overflow-hidden w-full">
            <div className="w-full">
              <MilestoneField
                milestone={milestone ? { ...milestone, title: milestone.name } : null}
                setMilestone={(newMilestone) => {
                  if (newMilestone) {
                    // Convert MilestoneField.Milestone to TaskBoard.Milestone
                    const convertedMilestone: Types.Milestone = {
                      ...newMilestone,
                      name: newMilestone.name || newMilestone.title || "",
                      status: "pending",
                    };
                    setMilestone(convertedMilestone);
                  } else {
                    setMilestone(null);
                  }
                }}
                milestones={milestones.map((m) => ({ ...m, title: m.name }))}
                onSearch={onMilestoneSearch}
                emptyStateMessage="Select milestone"
                readonly={milestoneReadOnly}
              />
            </div>
          </div>
        </div>

        {richTextHandlers && (
          <div>
            <label className="block text-sm font-medium text-content-base mb-1">Notes</label>
            <TaskNotesField key={descriptionEditorKey} richTextHandlers={richTextHandlers} onChange={setDescription} />
          </div>
        )}

        <div className="flex items-center mt-8">
          <SwitchToggle value={createMore} setValue={setCreateMore} label="Create more" testId="add-more-switch" />
          <div className="flex-1"></div>
          <div className="flex space-x-3">
            <SecondaryButton onClick={onClose} type="button">
              Cancel
            </SecondaryButton>
            <PrimaryButton type="submit" disabled={disabled}>
              Create task
            </PrimaryButton>
          </div>
        </div>
      </form>
    </Modal>
  );
}

interface TaskNotesFieldProps {
  richTextHandlers: RichEditorHandlers;
  onChange: (description: any) => void;
}

function TaskNotesField({ richTextHandlers, onChange }: TaskNotesFieldProps) {
  const editor = useEditor({
    content: null,
    editable: true,
    placeholder: "Add notes about this task...",
    handlers: richTextHandlers,
    onUpdate: ({ json }) => onChange(json),
  });

  return <Editor editor={editor} />;
}

export default TaskCreationModal;
