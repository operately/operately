import React, { useEffect, useState } from "react";
import { AssigneesField } from "../AssigneesField";
import { PrimaryButton, SecondaryButton } from "../Button";
import { DateField } from "../DateField";
import { MilestoneField } from "../MilestoneField";
import type { Milestone as MilestoneFieldMilestone } from "../MilestoneField";
import Modal from "../Modal";
import { RelativeDayField } from "../RelativeDayField";
import { StatusSelector } from "../StatusSelector";
import { SwitchToggle } from "../SwitchToggle";
import { TextField } from "../TextField";
import { Editor, useEditor } from "../RichEditor";
import { isContentEmpty } from "../RichContent";
import type { RichTextJSON } from "../RichContent";
import type { RichEditorHandlers } from "../RichEditor/useEditor";
import * as Types from "../TaskBoard/types";
import { isProjectTaskCreationProps } from "./types";
import type { TaskCreationModal as TaskCreationModalTypes } from "./types";

export function TaskCreationModal(props: TaskCreationModal.Props) {
  if (isProjectTaskCreationProps(props)) {
    return <ProjectTaskCreationForm {...props} />;
  }

  return <TemplateTaskCreationForm {...props} />;
}

export namespace TaskCreationModal {
  export type ProjectProps = TaskCreationModalTypes.ProjectProps;
  export type TemplateProps = TaskCreationModalTypes.TemplateProps;
  export type Props = TaskCreationModalTypes.Props;
}

function ProjectTaskCreationForm({
  isOpen,
  onClose,
  onCreateTask,
  milestones = [],
  currentMilestoneId,
  assigneePersonSearch,
  onMilestoneSearch,
  milestoneReadOnly,
  richTextHandlers,
  formattedTimePreferences,
}: TaskCreationModal.ProjectProps) {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState<DateField.ContextualDate | null>(null);
  const [assignees, setAssignees] = useState<Types.Person[]>([]);
  const [milestone, setMilestone] = useState<Types.Milestone | null>(null);
  const [description, setDescription] = useState<RichTextJSON | null>(null);
  const [descriptionEditorKey, setDescriptionEditorKey] = useState(0);
  const [createMore, setCreateMore] = useState(false);

  const disabled = !title.trim();

  useEffect(() => {
    if (isOpen) {
      if (currentMilestoneId === "no-milestone") {
        setMilestone(null);
      } else if (currentMilestoneId) {
        const selectedMilestone = milestones.find((item) => item.id === currentMilestoneId);
        setMilestone(selectedMilestone || null);
      } else {
        setMilestone(null);
      }
    }
  }, [isOpen, currentMilestoneId, milestones]);

  const resetForm = () => {
    setTitle("");
    setDueDate(null);
    setAssignees([]);
    setDescription(null);
    setDescriptionEditorKey((key) => key + 1);
  };

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
                milestones={milestones.map((item) => ({ ...item, title: item.name }))}
                onSearch={onMilestoneSearch}
                emptyStateMessage="Select milestone"
                readonly={milestoneReadOnly}
                formattedTimePreferences={formattedTimePreferences}
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

        <CreateMoreFooter
          createMore={createMore}
          setCreateMore={setCreateMore}
          createMoreTestId="add-more-switch"
          disabled={disabled}
          onClose={onClose}
        />
      </form>
    </Modal>
  );
}

function TemplateTaskCreationForm({
  isOpen,
  onClose,
  onCreateTask,
  milestones,
  currentMilestoneId,
  milestoneReadOnly,
  statuses,
  personSearch,
  richTextHandlers,
}: TaskCreationModal.TemplateProps) {
  const [name, setName] = useState("");
  const [dueOffsetDays, setDueOffsetDays] = useState<number | null>(null);
  const [milestoneId, setMilestoneId] = useState<string | null>(null);
  const [statusId, setStatusId] = useState(statuses[0]?.id ?? "");
  const [description, setDescription] = useState<RichTextJSON | null>(null);
  const [descriptionEditorKey, setDescriptionEditorKey] = useState(0);
  const [createMore, setCreateMore] = useState(false);
  const [assignees, setAssignees] = useState<AssigneesField.Person[]>([]);
  const milestoneOptions: MilestoneFieldMilestone[] = milestones.map((milestone) => ({
    id: milestone.id,
    name: milestone.title,
  }));
  const selectedMilestone = milestoneOptions.find((milestone) => milestone.id === milestoneId) ?? null;
  const selectedStatus = statuses.find((status) => status.id === statusId) ?? null;
  const disabled = !name.trim() || statuses.length === 0;

  const resetForm = () => {
    setName("");
    setDueOffsetDays(null);
    setMilestoneId(currentMilestoneId ?? null);
    setStatusId(statuses[0]?.id ?? "");
    setDescription(null);
    setAssignees([]);
    setDescriptionEditorKey((key) => key + 1);
  };

  useEffect(() => {
    if (isOpen) resetForm();
  }, [isOpen]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();

    const status = statuses.find((item) => item.id === statusId) ?? statuses[0];
    if (!name.trim() || !status) return;

    onCreateTask({
      name: name.trim(),
      description: description && !isContentEmpty(description) ? description : null,
      milestoneId,
      dueOffsetDays,
      status,
      priority: null,
      size: null,
      reminders: [],
      assignees: assignees.map((person) => ({
        id: person.id,
        person,
        role: "contributor",
        responsibility: null,
        accessLevel: 70,
        active: true,
      })),
    });

    if (createMore) {
      setName("");
      setDueOffsetDays(null);
      setDescription(null);
      setDescriptionEditorKey((key) => key + 1);
    } else {
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Task" size="medium">
      <form onSubmit={submit} className="min-w-0 space-y-6 overflow-x-hidden" data-test-id="template-task-form">
        <TextField
          variant="form-field"
          label="Task title"
          text={name}
          onChange={setName}
          placeholder="Enter task title"
          autofocus
          onChangeOnType
          testId="template-task-title"
        />

        <div className="grid min-w-0 grid-cols-1 gap-6 md:grid-cols-2">
          <RelativeDayField
            variant="form-field"
            label="Relative due date"
            value={dueOffsetDays}
            onChange={setDueOffsetDays}
            placeholder="Set relative date"
          />
          <div className="min-w-0">
            <FieldLabel>Status</FieldLabel>
            <StatusSelector
              variant="form-field"
              statusOptions={statuses}
              status={selectedStatus}
              onChange={(status) => setStatusId(status.id)}
              testId="template-task-status"
            />
          </div>
        </div>

        <div className="min-w-0">
          <FieldLabel>Milestone</FieldLabel>
          <MilestoneField
            variant="form-field"
            milestone={selectedMilestone}
            setMilestone={(milestone) => setMilestoneId(milestone?.id ?? null)}
            milestones={milestoneOptions}
            onSearch={async () => undefined}
            emptyStateMessage="No milestone"
            readonly={milestoneReadOnly}
            testId="template-task-milestone"
          />
        </div>

        <div className="min-w-0 overflow-x-auto">
          <FieldLabel>Notes</FieldLabel>
          <TaskNotesField key={descriptionEditorKey} richTextHandlers={richTextHandlers} onChange={setDescription} />
        </div>

        {personSearch && (
          <div className="min-w-0">
            <FieldLabel>Assignees</FieldLabel>
            <AssigneesField
              variant="form-field"
              people={assignees}
              setPeople={setAssignees}
              searchData={personSearch}
              emptyStateMessage="Assign people"
            />
          </div>
        )}

        <CreateMoreFooter
          createMore={createMore}
          setCreateMore={setCreateMore}
          createMoreTestId="add-template-task-more-switch"
          disabled={disabled}
          onClose={onClose}
        />
      </form>
    </Modal>
  );
}

function CreateMoreFooter({
  createMore,
  setCreateMore,
  createMoreTestId,
  disabled,
  onClose,
}: {
  createMore: boolean;
  setCreateMore: (value: boolean) => void;
  createMoreTestId: string;
  disabled: boolean;
  onClose: () => void;
}) {
  return (
    <div className="mt-8 flex items-center">
      <SwitchToggle value={createMore} setValue={setCreateMore} label="Create more" testId={createMoreTestId} />
      <div className="flex-1" />
      <div className="flex space-x-3">
        <SecondaryButton onClick={onClose} type="button">
          Cancel
        </SecondaryButton>
        <PrimaryButton type="submit" disabled={disabled}>
          Create task
        </PrimaryButton>
      </div>
    </div>
  );
}

function TaskNotesField({
  richTextHandlers,
  onChange,
}: {
  richTextHandlers: RichEditorHandlers;
  onChange: (description: RichTextJSON) => void;
}) {
  const editor = useEditor({
    content: null,
    editable: true,
    placeholder: "Add notes about this task...",
    handlers: richTextHandlers,
    onUpdate: ({ json }) => onChange(json as RichTextJSON),
  });

  return <Editor editor={editor} />;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-1 block text-left text-sm font-bold">{children}</label>;
}
