import React, { useCallback } from "react";
import { RelativeDayField } from "../RelativeDayField";
import { StatusSelector } from "../StatusSelector";
import { SecondaryButton } from "../Button";
import { AssigneesField } from "../AssigneesField";
import { AvatarList } from "../Avatar";
import { Tooltip } from "../Tooltip";
import { IconAlertTriangleFilled, IconX } from "../icons";
import { DescriptionIndicator } from "../TaskBoard/components/DescriptionIndicator";
import { isContentEmpty } from "../RichContent";
import type { TemplateProjectPage } from ".";
import { useSortableItem } from "../utils/PragmaticDragAndDrop";
import classNames from "../utils/classnames";

// Match TaskItem: empty due dates stay in layout but are invisible until the row is hovered.
const EMPTY_DUE_DATE_REVEAL_CLASS =
  "[&>span]:text-transparent max-sm:[&>span]:text-content-dimmed sm:group-hover/task-row:[&>span]:text-content-dimmed group-focus-within/task-row:[&>span]:text-content-dimmed";

export function TaskRow({
  task,
  props,
  canEdit,
  onClick,
  index,
  containerId,
  isDraggable,
}: {
  task: TemplateProjectPage.Task;
  props: TemplateProjectPage.Props;
  canEdit: boolean;
  onClick?: () => void;
  index: number;
  containerId: string;
  isDraggable: boolean;
}) {
  const activeAssignees = React.useMemo(
    () => (task.assignees ?? []).filter((assignee) => assignee.active && assignee.person),
    [task.assignees],
  );
  const activePeople = React.useMemo(
    () => activeAssignees.flatMap((assignee) => (assignee.person ? [assignee.person] : [])),
    [activeAssignees],
  );
  const unavailableAssignees = React.useMemo(
    () => (task.assignees ?? []).filter((assignee) => !assignee.active || !assignee.person),
    [task.assignees],
  );
  const [currentAssignees, setCurrentAssignees] = React.useState(activePeople);
  const confirmedAssignees = React.useRef(activePeople);
  const pendingAssignees = React.useRef<AssigneesField.Person[] | null>(null);
  const latestUpdate = React.useRef(0);
  const { ref, isDragging } = useSortableItem<HTMLDivElement>({
    itemId: task.id,
    index,
    containerId,
    disabled: !isDraggable,
  });

  React.useEffect(() => {
    confirmedAssignees.current = activePeople;
    if (!pendingAssignees.current) setCurrentAssignees(activePeople);
  }, [activePeople]);

  const updateAssignees = useCallback(
    async (people: AssigneesField.Person[]) => {
      const updateId = ++latestUpdate.current;
      pendingAssignees.current = people;
      setCurrentAssignees(people);
      const successful = await props.onTaskUpdate?.(task.id, {
        assignees: people.map(
          (person) =>
            activeAssignees.find((assignee) => assignee.person?.id === person.id) ?? {
              id: person.id,
              person,
              role: "contributor",
              responsibility: null,
              accessLevel: 70,
              active: true,
            },
        ),
      });

      if (updateId !== latestUpdate.current) return;

      pendingAssignees.current = null;
      if (successful === false) setCurrentAssignees(confirmedAssignees.current);
    },
    [activeAssignees, props.onTaskUpdate, task.id],
  );

  const stopDragFromInteractive = (event: React.MouseEvent) => event.stopPropagation();
  const hasDueDate = task.dueOffsetDays !== null;

  return (
    <div
      ref={ref}
      className={classNames("group/task-row border-b border-surface-outline last:border-b-0 focus-visible:outline-none", {
        "cursor-grab active:cursor-grabbing": isDraggable && !isDragging,
        "cursor-grabbing bg-surface-accent": isDragging,
      })}
      data-test-id={`template-task-${task.id}`}
      data-task-row-id={task.id}
    >
      <div
        className={classNames(
          "flex items-center gap-3 px-4 py-2.5 transition-colors",
          "bg-surface-base hover:bg-surface-highlight",
          "group-focus-visible/task-row:bg-[rgba(224,242,254,0.75)] group-focus-visible/task-row:shadow-[inset_0_0_0_2px_var(--color-brand-1)] dark:group-focus-visible/task-row:bg-[rgba(37,99,235,0.20)]",
        )}
      >
        <div onMouseDown={stopDragFromInteractive}>
          <StatusSelector
            statusOptions={props.statuses}
            status={task.status}
            onChange={(status) => props.onTaskUpdate?.(task.id, { status })}
            readonly={!canEdit}
            size="md"
          />
        </div>
        <div className="min-w-0 flex-1" onMouseDown={stopDragFromInteractive}>
          {onClick ? (
            <button type="button" className="max-w-full text-left text-sm font-medium" onClick={onClick}>
              <TaskTitleContent task={task} />
            </button>
          ) : (
            <div className="text-sm font-medium">
              <TaskTitleContent task={task} />
            </div>
          )}
        </div>
        <div onMouseDown={stopDragFromInteractive}>
          <RelativeDayField
            value={task.dueOffsetDays}
            onChange={(dueOffsetDays) => {
              void props.onTaskUpdate?.(task.id, { dueOffsetDays });
            }}
            readonly={!canEdit}
            placeholder="Set when due"
            hideCalendarIcon={!hasDueDate}
            className={hasDueDate ? undefined : EMPTY_DUE_DATE_REVEAL_CLASS}
            testId={`template-task-${task.id}-due-offset`}
          />
        </div>
        <div
          className="flex h-6 min-w-6 max-w-[10rem] flex-shrink-0 items-center justify-end gap-1"
          onMouseDown={stopDragFromInteractive}
        >
          <UnavailableTaskAssignees
            assignees={unavailableAssignees}
            onRemove={canEdit ? () => updateAssignees(currentAssignees) : undefined}
          />
          {canEdit && props.personSearch ? (
            <AssigneesField
              people={currentAssignees}
              setPeople={updateAssignees}
              searchData={props.personSearch}
              avatarSize={24}
              avatarOnly
              maxAvatars={4}
              testId={`template-task-${task.id}-assignees`}
            />
          ) : (
            <AssigneesField
              people={currentAssignees}
              readonly
              avatarSize={24}
              avatarOnly
              maxAvatars={4}
              testId={`template-task-${task.id}-assignees`}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function TaskTitleContent({ task }: { task: TemplateProjectPage.Task }) {
  return (
    <span className="inline-flex h-6 max-w-full items-center gap-1.5 truncate">
      <span className="truncate">{task.name}</span>
      <DescriptionIndicator hasDescription={!isContentEmpty(task.description)} iconSize={14} />
    </span>
  );
}

function UnavailableTaskAssignees({
  assignees,
  onRemove,
}: {
  assignees: TemplateProjectPage.TemplatePerson[];
  onRemove?: () => void;
}) {
  if (assignees.length === 0) return null;

  const people = assignees.map(
    (assignee) => assignee.person ?? { id: assignee.id, fullName: "Unavailable person", avatarUrl: null },
  );
  const names = people.map((person) => person.fullName).join(", ");
  const message = assignees.length === 1 ? `${names} is no longer active.` : `${names} are no longer active.`;

  return (
    <div className="flex items-center gap-0.5" data-test-id="unavailable-task-assignees">
      <Tooltip content={message} size="sm">
        <div className="relative opacity-60 grayscale">
          <AvatarList people={people} size={24} maxElements={3} stacked />
          <IconAlertTriangleFilled
            size={11}
            className="absolute -bottom-1 -right-1 text-amber-600 dark:text-amber-400"
          />
        </div>
      </Tooltip>
      {onRemove && (
        <SecondaryButton
          size="xxs"
          icon={IconX}
          iconSize={11}
          onClick={onRemove}
          ariaLabel="Remove unavailable assignees"
          testId="remove-unavailable-task-assignees"
          className="!h-5 !w-5 !rounded-full !border-0 !p-0 mb-5"
        >
          <span className="sr-only">Remove unavailable assignees</span>
        </SecondaryButton>
      )}
    </div>
  );
}
