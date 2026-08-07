import React, { useEffect } from "react";
import { RelativeDayField } from "../RelativeDayField";
import { MilestoneField, type Milestone as MilestoneFieldMilestone } from "../MilestoneField";
import { StatusSelector } from "../StatusSelector";
import { TextField } from "../TextField";
import { PrimaryButton, SecondaryButton } from "../Button";
import Modal from "../Modal";
import { SwitchToggle } from "../SwitchToggle";
import { Editor, useEditor } from "../RichEditor";
import { isContentEmpty } from "../RichContent";
import type { RichTextJSON } from "../RichContent";
import { TasksMenu } from "../TaskBoard";
import { TaskRow } from "./TaskRow";
import { MilestoneFormModal } from "./MilestoneFormModal";
import type { TemplateProjectPage } from ".";
import { TemplateTaskAssignees } from "./People";

export function TaskBoard({ props, canEdit }: { props: TemplateProjectPage.Props; canEdit: boolean }) {
  const [isCreating, setIsCreating] = React.useState(false);
  const [isCreatingMilestone, setIsCreatingMilestone] = React.useState(false);
  const [taskBeingEdited, setTaskBeingEdited] = React.useState<TemplateProjectPage.Task | null>(null);
  const orderedMilestones: Array<TemplateProjectPage.Milestone | null> = [null, ...props.milestones];

  return (
    <div className="mx-auto flex max-w-6xl flex-col pb-8" data-test-id="template-task-board">
      {canEdit && (
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 bg-surface-base px-4 py-4 sm:items-center sm:py-6 lg:px-0">
          <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-4">
            <PrimaryButton size="xs" onClick={() => setIsCreating(true)} testId="add-template-task">
              New task
            </PrimaryButton>
            <SecondaryButton size="xs" onClick={() => setIsCreatingMilestone(true)} testId="add-template-milestone">
              New milestone
            </SecondaryButton>
          </div>
          <div className="flex flex-shrink-0 items-center gap-1 sm:-mb-2">
            <TasksMenu
              canManageStatuses={Boolean(props.onStatusesChange)}
              statuses={props.statuses}
              onSaveCustomStatuses={(payload) => props.onStatusesChange?.(payload)}
            />
          </div>
        </div>
      )}
      <TaskFormModal isOpen={isCreating} onClose={() => setIsCreating(false)} props={props} />
      <TaskFormModal
        isOpen={taskBeingEdited !== null}
        onClose={() => setTaskBeingEdited(null)}
        props={props}
        task={taskBeingEdited}
      />
      <MilestoneFormModal
        isOpen={isCreatingMilestone}
        onClose={() => setIsCreatingMilestone(false)}
        onCreate={props.onMilestoneCreate}
      />
      <div className="overflow-hidden rounded-md border border-surface-outline bg-surface-base">
        {orderedMilestones.map((milestone) => {
          const tasks = props.tasks.filter((task) => task.milestoneId === (milestone?.id ?? null));
          if (tasks.length === 0 && milestone === null) return null;
          return (
            <section key={milestone?.id ?? "root"}>
              <div className="border-b border-surface-outline bg-surface-dimmed px-4 py-3 text-sm font-semibold">
                {milestone?.title ?? "No milestone"}
              </div>
              {tasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  props={props}
                  canEdit={canEdit}
                  onClick={() => setTaskBeingEdited(task)}
                  index={tasks.indexOf(task)}
                />
              ))}
              {tasks.length === 0 && <div className="px-4 py-3 text-sm text-content-dimmed">No tasks</div>}
            </section>
          );
        })}
        {props.tasks.length === 0 && props.milestones.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-content-dimmed">
            Add the first task to define the work.
          </div>
        )}
      </div>
    </div>
  );
}

function TaskFormModal({
  isOpen,
  onClose,
  props,
  task = null,
}: {
  isOpen: boolean;
  onClose: () => void;
  props: TemplateProjectPage.Props;
  task?: TemplateProjectPage.Task | null;
}) {
  const [name, setName] = React.useState("");
  const [dueOffsetDays, setDueOffsetDays] = React.useState<number | null>(null);
  const [milestoneId, setMilestoneId] = React.useState<string | null>(null);
  const [statusId, setStatusId] = React.useState(props.statuses[0]?.id ?? "");
  const [description, setDescription] = React.useState<RichTextJSON | null>(null);
  const [descriptionEditorKey, setDescriptionEditorKey] = React.useState(0);
  const [createMore, setCreateMore] = React.useState(false);
  const milestoneOptions: MilestoneFieldMilestone[] = props.milestones.map((milestone) => ({
    id: milestone.id,
    name: milestone.title,
  }));
  const selectedMilestone = milestoneOptions.find((milestone) => milestone.id === milestoneId) ?? null;
  const selectedStatus = props.statuses.find((status) => status.id === statusId) ?? null;
  const isUpdating = task !== null;

  const resetForm = () => {
    setName(task?.name ?? "");
    setDueOffsetDays(task?.dueOffsetDays ?? null);
    setMilestoneId(task?.milestoneId ?? null);
    setStatusId(task?.status.id ?? props.statuses[0]?.id ?? "");
    setDescription(task?.description ?? null);
    setDescriptionEditorKey((key) => key + 1);
  };

  useEffect(() => {
    if (isOpen) resetForm();
  }, [isOpen, task]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();

    const status = props.statuses.find((item) => item.id === statusId) ?? props.statuses[0];
    if (!name.trim() || !status) return;

    const taskFields = {
      name: name.trim(),
      description: description && !isContentEmpty(description) ? description : null,
      milestoneId,
      dueOffsetDays,
      status,
    };

    if (task) {
      props.onTaskUpdate?.(task.id, taskFields);
      onClose();
      return;
    }

    props.onTaskCreate?.({ ...taskFields, priority: null, size: null, reminders: [], assignees: [] });

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
    <Modal isOpen={isOpen} onClose={onClose} title={isUpdating ? "Update Task" : "Create Task"} size="medium">
      <form onSubmit={submit} className="space-y-6" data-test-id="template-task-form">
        <TextField
          variant="form-field"
          label="Task title"
          text={name}
          onChange={setName}
          placeholder="Enter task title"
          autofocus
          testId="template-task-title"
        />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-content-base">Relative due date</label>
            <RelativeDayField value={dueOffsetDays} onChange={setDueOffsetDays} placeholder="Set relative date" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-content-base">Status</label>
            <StatusSelector
              statusOptions={props.statuses}
              status={selectedStatus}
              onChange={(status) => setStatusId(status.id)}
              showFullBadge
              testId="template-task-status"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-content-base">Milestone</label>
          <MilestoneField
            milestone={selectedMilestone}
            setMilestone={(milestone) => setMilestoneId(milestone?.id ?? null)}
            milestones={milestoneOptions}
            onSearch={async () => undefined}
            emptyStateMessage="No milestone"
            testId="template-task-milestone"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-content-base">Notes</label>
          <TaskNotesField key={descriptionEditorKey} props={props} content={description} onChange={setDescription} />
        </div>

        {task && (task.assignees?.length ?? 0) > 0 && (
          <div>
            <label className="mb-1 block text-sm font-medium text-content-base">Assignees</label>
            <TemplateTaskAssignees assignees={task.assignees ?? []} />
          </div>
        )}

        <div className="mt-8 flex items-center">
          {!isUpdating && (
            <SwitchToggle
              value={createMore}
              setValue={setCreateMore}
              label="Create more"
              testId="add-template-task-more-switch"
            />
          )}
          <div className="flex-1" />
          <div className="flex space-x-3">
            <SecondaryButton onClick={onClose} type="button">
              Cancel
            </SecondaryButton>
            <PrimaryButton type="submit" disabled={!name.trim() || props.statuses.length === 0}>
              {isUpdating ? "Update task" : "Create task"}
            </PrimaryButton>
          </div>
        </div>
      </form>
    </Modal>
  );
}

function TaskNotesField({
  props,
  content,
  onChange,
}: {
  props: TemplateProjectPage.Props;
  content: RichTextJSON | null;
  onChange: (description: RichTextJSON) => void;
}) {
  const editor = useEditor({
    content,
    editable: true,
    placeholder: "Add notes about this task...",
    handlers: props.richTextHandlers,
    onUpdate: ({ json }) => onChange(json as RichTextJSON),
  });

  return <Editor editor={editor} />;
}
