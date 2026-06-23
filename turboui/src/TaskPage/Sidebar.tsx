import { IconArchive, IconCalendar, IconCircleArrowRight, IconLink, IconPlus, IconTrash } from "../icons";
import React from "react";
import { TaskPage } from ".";
import { AvatarWithName } from "../Avatar";
import { AssigneesField } from "../AssigneesField";
import { WarningCallout } from "../Callouts";
import { DateField } from "../DateField";
import FormattedTime from "../FormattedTime";
import { MilestoneField } from "../MilestoneField";
import { durationHumanized, isOverdue } from "../utils/time";
import { SidebarNotificationSection, SidebarSection } from "../SidebarSection";
import { showSuccessToast, showErrorToast } from "../Toasts";

export function Sidebar(props: TaskPage.ContentState) {
  return (
    <div className="sm:col-span-4 space-y-6 hidden sm:block sm:pl-8" data-test-id="task-sidebar">
      <DueDate {...props} />
      <Reminders {...props} />
      <Assignees {...props} />
      <Milestone {...props} />
      <CreatedBy {...props} />
      <Subscription {...props} />
      <Actions {...props} />
    </div>
  );
}

// Compact, mobile-only subset of sidebar content
export function MobileSidebar(props: TaskPage.ContentState) {
  return (
    <div className="sm:hidden block mt-4">
      <div className="grid grid-cols-[auto_auto_1fr] gap-4 items-start">
        <div>
          <DueDateMobile {...props} />
        </div>
        <div>
          <AssigneeMobile {...props} />
        </div>
      </div>
      {hasReminderRecipients(props) && (
        <div className="mt-4">
          <Reminders {...props} />
        </div>
      )}
      <div className="mt-4">
        <Milestone {...props} />
      </div>
    </div>
  );
}

function DueDate(props: TaskPage.ContentState) {
  return (
    <SidebarSection title="Due date">
      <DateField
        date={props.dueDate ?? null}
        onDateSelect={props.onDueDateChange}
        readonly={!props.canEdit}
        showOverdueWarning={!props.status?.closed}
        placeholder="Set due date"
        testId="task-due-date"
        calendarOnly
      />
      <OverdueWarning {...props} />
    </SidebarSection>
  );
}

function Reminders(props: TaskPage.ContentState) {
  const reminderKeys = React.useRef<string[]>([]);

  if (!hasReminderRecipients(props)) return null;

  const reminders = normalizeReminders(props.reminders ?? [], props.dueDate);
  syncReminderKeys(reminderKeys.current, reminders.length);

  const updateReminder = (index: number, updates: Partial<TaskPage.Reminder>) => {
    const next = reminders.map((reminder, currentIndex) => {
      if (currentIndex !== index) return reminder;

      return normalizeReminder({ ...reminder, ...updates });
    });

    props.onRemindersChange(next);
  };

  const addReminder = () => {
    reminderKeys.current.push(createReminderKey());
    props.onRemindersChange([...reminders, defaultReminder(props.dueDate)]);
  };

  const removeReminder = (index: number) => {
    reminderKeys.current.splice(index, 1);
    props.onRemindersChange(reminders.filter((_reminder, currentIndex) => currentIndex !== index));
  };

  return (
    <SidebarSection title="Reminders" testId="task-reminders">
      <div className="space-y-2">
        {reminders.map((reminder, index) => (
          <ReminderRow
            key={reminderKeys.current[index]}
            reminder={reminder}
            index={index}
            readonly={!props.canEdit}
            hasDueDate={!!props.dueDate}
            onUpdate={updateReminder}
            onRemove={removeReminder}
          />
        ))}

        {props.canEdit && (
          <button
            type="button"
            onClick={addReminder}
            data-test-id="add-task-reminder"
            className="inline-flex items-center gap-1 text-xs text-content-dimmed hover:text-content-base"
          >
            <IconPlus size={12} />
            Add reminder
          </button>
        )}
      </div>
    </SidebarSection>
  );
}

function hasReminderRecipients(props: TaskPage.ContentState) {
  return props.assignees.length > 0;
}

function ReminderRow({
  reminder,
  index,
  readonly,
  hasDueDate,
  onUpdate,
  onRemove,
}: {
  reminder: TaskPage.Reminder;
  index: number;
  readonly: boolean;
  hasDueDate: boolean;
  onUpdate: (index: number, updates: Partial<TaskPage.Reminder>) => void;
  onRemove: (index: number) => void;
}) {
  const dayLabel = (reminder.days ?? 1) === 1 ? "day" : "days";
  const typeOptions = reminderTypeOptions(hasDueDate);

  return (
    <div className="flex items-center gap-2 text-xs" data-test-id={`task-reminder-${index}`}>
      <select
        value={reminder.type}
        disabled={readonly}
        onChange={(e) => onUpdate(index, { type: e.target.value as TaskPage.ReminderType })}
        className="min-w-0 flex-1 rounded border border-stroke-base bg-surface-base px-2 py-1"
        aria-label="Reminder type"
      >
        {typeOptions.map((option) => (
          <option key={option.type} value={option.type}>
            {option.label}
          </option>
        ))}
      </select>

      {reminder.type === "before_due" && (
        <>
          <input
            type="number"
            min={1}
            value={reminder.days ?? 1}
            disabled={readonly}
            onChange={(e) => onUpdate(index, { days: normalizeReminderDays(e.target.value) })}
            className="w-14 rounded border border-stroke-base bg-surface-base px-2 py-1"
            aria-label="Days before due date"
          />
          <span className="w-10 text-content-dimmed">{dayLabel}</span>
        </>
      )}

      {reminder.type === "on_date" && (
        <input
          type="date"
          value={reminder.date ?? defaultReminderDate()}
          disabled={readonly}
          onChange={(e) => onUpdate(index, { date: normalizeReminderDate(e.target.value) })}
          className="w-32 rounded border border-stroke-base bg-surface-base px-2 py-1"
          aria-label="Reminder date"
        />
      )}

      {!readonly && (
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="p-1 text-content-dimmed hover:text-content-error"
          aria-label="Remove reminder"
        >
          <IconTrash size={14} />
        </button>
      )}
    </div>
  );
}

function defaultReminder(dueDate: TaskPage.ContentState["dueDate"]): TaskPage.Reminder {
  if (dueDate) return { type: "before_due", days: 1, date: null };
  return { type: "on_date", days: null, date: defaultReminderDate() };
}

function normalizeReminder(reminder: TaskPage.Reminder): TaskPage.Reminder {
  switch (reminder.type) {
    case "before_due":
      return { ...reminder, days: normalizeReminderDays(reminder.days), date: null };

    case "on_date":
      return { ...reminder, days: null, date: normalizeReminderDate(reminder.date) };

    case "due_day":
    case "overdue":
      return { ...reminder, days: null, date: null };
  }
}

function normalizeReminders(reminders: TaskPage.Reminder[], dueDate: TaskPage.ContentState["dueDate"]) {
  return reminders
    .filter((reminder) => dueDate || reminder.type === "on_date")
    .map((reminder) => normalizeReminder(reminder));
}

function reminderTypeOptions(hasDueDate: boolean) {
  const dueDateOptions: Array<{ type: TaskPage.ReminderType; label: string }> = [
    { type: "before_due", label: "Before due date" },
    { type: "due_day", label: "Due date" },
    { type: "overdue", label: "Overdue" },
  ];

  const onDateOption = { type: "on_date" as const, label: "On date" };

  if (hasDueDate) return [...dueDateOptions, onDateOption];
  return [onDateOption];
}

function normalizeReminderDays(value: string | number | null | undefined) {
  const number = typeof value === "number" ? value : Number.parseInt(value ?? "0", 10);
  if (!Number.isFinite(number)) return 1;
  return Math.max(1, number);
}

function normalizeReminderDate(value: string | null | undefined) {
  return value || defaultReminderDate();
}

function defaultReminderDate() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return formatDateForInput(date);
}

function formatDateForInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function syncReminderKeys(keys: string[], length: number) {
  while (keys.length < length) keys.push(createReminderKey());
  if (keys.length > length) keys.length = length;
}

function createReminderKey() {
  return `reminder-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function Assignees(props: TaskPage.ContentState) {
  return (
    <SidebarSection title="Assignees">
      <AssigneesField
        people={props.assignees}
        setPeople={props.onAssigneesChange}
        readonly={!props.canEdit}
        searchData={props.assigneePersonSearch}
        emptyStateMessage="Assign task"
        emptyStateReadOnlyMessage="No assignees"
        testId="assignee"
      />
    </SidebarSection>
  );
}

function DueDateMobile(props: TaskPage.ContentState) {
  return (
    <SidebarSection title="Due date">
      <DateField
        date={props.dueDate ?? null}
        onDateSelect={props.onDueDateChange}
        readonly={!props.canEdit}
        showOverdueWarning={!props.status?.closed}
        placeholder="Set due date"
        calendarOnly
        size="small"
      />
    </SidebarSection>
  );
}

function AssigneeMobile(props: TaskPage.ContentState) {
  return (
    <SidebarSection title="Assignees">
      <AssigneesField
        people={props.assignees}
        setPeople={props.onAssigneesChange}
        readonly={!props.canEdit}
        searchData={props.assigneePersonSearch}
        emptyStateMessage="Assign task"
        emptyStateReadOnlyMessage="No assignees"
        size="small"
        showTitle={false}
      />
    </SidebarSection>
  );
}

function Milestone(props: TaskPage.ContentState) {
  if (props.hideMilestone) return null;

  return (
    <SidebarSection title="Milestone">
      <MilestoneField
        milestone={props.milestone}
        setMilestone={props.onMilestoneChange}
        readonly={!props.canEdit}
        milestones={props.milestones}
        onSearch={props.onMilestoneSearch}
        emptyStateMessage="Select milestone"
        emptyStateReadOnlyMessage="No milestone"
        formattedTimePreferences={props.formattedTimePreferences}
      />
    </SidebarSection>
  );
}

function CreatedBy(props: TaskPage.ContentState) {
  if (!props.createdBy) return null;

  return (
    <SidebarSection title="Created">
      <div className="space-y-2 text-sm">
        <AvatarWithName person={props.createdBy} size={"tiny"} nameFormat="short" link={props.createdBy.profileLink} />
        <div className="flex items-center gap-1.5 ml-1 text-content-dimmed text-xs">
          <IconCalendar size={14} />
          <FormattedTime {...props.formattedTimePreferences} time={props.createdAt} format="short-date" />
        </div>
      </div>
    </SidebarSection>
  );
}

function Subscription(props: TaskPage.ContentState) {
  return <SidebarNotificationSection {...props.subscriptions} />;
}

function Actions(props: TaskPage.ContentState) {
  const handleCopyURL = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showSuccessToast("Success", "Task URL copied to clipboard");
    } catch {
      showErrorToast("Copy failed", "Unable to copy URL to clipboard");
    }
  };

  const actions = [
    {
      label: "Copy URL",
      onClick: handleCopyURL,
      icon: IconLink,
      show: true,
    },
    {
      label: "Move task",
      onClick: props.openMoveModal,
      icon: IconCircleArrowRight,
      show: Boolean(props.canEdit && props.onMoveTask && props.projectSearch && props.spaceSearch),
      testId: "move-task",
    },
    {
      label: "Archive",
      onClick: props.onArchive,
      icon: IconArchive,
      show: !!props.onArchive,
    },
    {
      label: "Delete",
      onClick: props.openDeleteModal,
      icon: IconTrash,
      show: props.canEdit,
      danger: true,
      testId: "delete-task",
    },
  ].filter((action) => action.show);

  if (actions.length === 0) return null;

  return (
    <SidebarSection title="Actions">
      <div className="space-y-1">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={action.onClick}
            className={`flex items-center gap-2 text-xs hover:bg-surface-highlight rounded px-2 py-1 -mx-2 w-full text-left ${
              action.danger ? "text-content-error hover:bg-red-50" : ""
            }`}
            data-test-id={action.testId}
          >
            <action.icon size={16} className={action.danger ? "text-content-error" : "text-content-dimmed"} />
            <span>{action.label}</span>
          </button>
        ))}
      </div>
    </SidebarSection>
  );
}

function OverdueWarning(props: TaskPage.ContentState) {
  if (!props.dueDate || !props.dueDate.date) return null;
  if (!isOverdue(props.dueDate.date)) return null;
  if (props.status?.closed) return null; // Don't show overdue for completed tasks

  const duration = durationHumanized(props.dueDate.date, new Date());

  return (
    <div className="mt-2">
      <WarningCallout message={`Overdue by ${duration}.`} />
    </div>
  );
}
