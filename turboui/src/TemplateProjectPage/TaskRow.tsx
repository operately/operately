import React, { useCallback } from "react";
import { RelativeDayField } from "../RelativeDayField";
import { StatusSelector } from "../StatusSelector";
import { SecondaryButton } from "../Button";
import { AssigneesField } from "../AssigneesField";
import { AvatarList } from "../Avatar";
import { Tooltip } from "../Tooltip";
import { IconAlertTriangleFilled, IconX } from "../icons";
import type { TemplateProjectPage } from ".";
import { useSortableItem } from "../utils/PragmaticDragAndDrop";
import classNames from "../utils/classnames";

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
  onClick: () => void;
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

  return (
    <div
      ref={ref}
      className={classNames("border-b border-surface-outline last:border-b-0", {
        "cursor-grab active:cursor-grabbing": isDraggable && !isDragging,
        "cursor-grabbing bg-surface-accent": isDragging,
      })}
      data-test-id={`template-task-${task.id}`}
      data-task-row-id={task.id}
    >
      <div className="flex items-center gap-3 px-4 py-2.5">
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
          <button
            type="button"
            className="w-full truncate text-left text-sm font-medium"
            onClick={onClick}
            disabled={!canEdit}
          >
            {task.name}
          </button>
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
        <div onMouseDown={stopDragFromInteractive}>
          <RelativeDayField
            value={task.dueOffsetDays}
            onChange={(dueOffsetDays) => {
              void props.onTaskUpdate?.(task.id, { dueOffsetDays });
            }}
            readonly={!canEdit}
            testId={`template-task-${task.id}-due-offset`}
          />
        </div>
      </div>
    </div>
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
