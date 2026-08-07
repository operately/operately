import React, { useCallback } from "react";
import { RelativeDayField } from "../RelativeDayField";
import { StatusSelector } from "../StatusSelector";
import { GhostButton, SecondaryButton } from "../Button";
import { AssigneesField } from "../AssigneesField";
import { AvatarList } from "../Avatar";
import { Tooltip } from "../Tooltip";
import { IconAlertTriangleFilled, IconX } from "../icons";
import type { TemplateProjectPage } from ".";

export function TaskRow({
  task,
  props,
  canEdit,
  onClick,
  index,
}: {
  task: TemplateProjectPage.Task;
  props: TemplateProjectPage.Props;
  canEdit: boolean;
  onClick: () => void;
  index: number;
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

  return (
    <div className="border-b border-surface-outline last:border-b-0" data-test-id={`template-task-${task.id}`}>
      <div className="flex items-center gap-3 px-4 py-2.5">
        <StatusSelector
          statusOptions={props.statuses}
          status={task.status}
          onChange={(status) => props.onTaskUpdate?.(task.id, { status })}
          readonly={!canEdit}
          size="md"
        />
        <button
          type="button"
          className="min-w-0 flex-1 truncate text-left text-sm font-medium"
          onClick={onClick}
          disabled={!canEdit}
        >
          {task.name}
        </button>
        <div className="flex h-6 min-w-6 max-w-[10rem] flex-shrink-0 items-center justify-end gap-1">
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
        <RelativeDayField
          value={task.dueOffsetDays}
          onChange={(dueOffsetDays) => {
            void props.onTaskUpdate?.(task.id, { dueOffsetDays });
          }}
          readonly={!canEdit}
          testId={`template-task-${task.id}-due-offset`}
        />
        {canEdit && props.onTaskReorder && (
          <div className="flex gap-1">
            <GhostButton
              size="xs"
              onClick={() => props.onTaskReorder?.(task.id, task.milestoneId, Math.max(0, index - 1))}
              disabled={index === 0}
            >
              Move up
            </GhostButton>
            <GhostButton size="xs" onClick={() => props.onTaskReorder?.(task.id, task.milestoneId, index + 1)}>
              Move down
            </GhostButton>
          </div>
        )}
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
