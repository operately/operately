import * as React from "react";
import * as Milestones from "@/graphql/Projects/milestones";

import Button from "@/components/Button";
import FormattedTime from "@/components/FormattedTime";

import * as Time from "@/utils/time";
import * as Icons from "@tabler/icons-react";

import { DateSelector } from "./DateSelector";

export function MilestoneList({ form }) {
  return (
    <div className="flex flex-col gap-2 my-3">
      {form.milestoneList.milestones.map((m: Milestones.Milestone) => (
        <MilestoneListItem key={m.id} milestone={m} form={form} />
      ))}

      <AddMilestone form={form} />
    </div>
  );
}

function AddMilestone({ form }) {
  const [active, setActive] = React.useState(false);

  const close = React.useCallback(() => {
    setActive(false);
  }, []);

  if (active) {
    return <AddMilestoneForm form={form} close={close} />;
  } else {
    return <AddMilestoneButton onClick={() => setActive(true)} />;
  }
}

function AddMilestoneButton({ onClick }) {
  return (
    <div
      className="py-2 px-3 border border-surface-outline bg-surface-accent rounded cursor-pointer hover:bg-surface-dimmed"
      onClick={onClick}
      data-test-id="add-milestone"
    >
      <div className="flex flex-col flex-1">
        <div className="flex items-center gap-1 text-content-dimmed font-medium">
          <Icons.IconPlus size={16} className="text-content-dimmed shrink-0" />
          Add milestone
        </div>
      </div>
    </div>
  );
}

function AddMilestoneForm({ form, close }) {
  const onSubmit = React.useCallback(async (id: string, title: string, dueDate: Date) => {
    await form.milestoneList.add({
      id: id,
      title,
      deadlineAt: dueDate.toISOString(),
    });

    close();
  }, []);

  return (
    <MilestoneForm
      form={form}
      formTitle="Add milestone"
      id={Math.random().toString(36)}
      initialTitle=""
      initialDueDate={null}
      onSubmit={onSubmit}
      onCancel={close}
    />
  );
}

function MilestoneListItem({ milestone, form }) {
  const [editing, setEditing] = React.useState(false);

  const edit = () => setEditing(true);
  const close = () => setEditing(false);

  if (!editing) {
    return <MilestoneDisplay milestone={milestone} form={form} edit={edit} />;
  } else {
    return <MilestoneEdit milestone={milestone} form={form} close={close} />;
  }
}

function MilestoneDisplay({ milestone, form, edit }) {
  return (
    <div
      className="py-2 px-3 border border-surface-outline bg-surface-accent rounded"
      data-test-id={milestoneTestID(milestone) + "-due"}
    >
      <div className="flex items-center justify-between">
        <div className="flex flex-col flex-1">
          <div className="font-bold flex items-center gap-1">
            <Icons.IconFlagFilled size={16} className="text-accent-1 shrink-0" />
            {milestone.title}
          </div>

          <div className="text-sm">
            Deadline: <FormattedTime time={Time.parse(milestone.deadlineAt)!} format="short-date" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div
            className="rounded-full bg-surface-dimmed hover:bg-surface-accent p-1 cursor-pointer hover:text-accent-1 transition-colors"
            onClick={edit}
            data-test-id={"edit-" + milestoneTestID(milestone)}
          >
            <Icons.IconPencil size={16} />
          </div>

          {milestone.deletable && (
            <div
              className="rounded-full bg-surface-dimmed hover:bg-surface-accent p-1 cursor-pointer hover:text-red-500 transition-colors"
              onClick={() => form.milestoneList.remove(milestone.id)}
              data-test-id={"remove-" + milestoneTestID(milestone)}
            >
              <Icons.IconTrash size={16} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MilestoneEdit({ milestone, form, close }) {
  const onSubmit = React.useCallback(async (id: string, title: string, dueDate: Date) => {
    await form.milestoneList.edit({
      id: id,
      title,
      deadlineAt: dueDate.toISOString(),
    });

    close();
  }, []);

  return (
    <MilestoneForm
      form={form}
      formTitle="Editing milestone"
      id={milestone.id}
      initialTitle={milestone.title}
      initialDueDate={Time.parse(milestone.deadlineAt)}
      onSubmit={onSubmit}
      onCancel={close}
    />
  );
}

function milestoneTestID(milestone: Milestones.Milestone) {
  return "milestone-" + milestone.title.toLowerCase().replace(/\s+/g, "-");
}

function MilestoneForm({ form, formTitle, id, initialTitle, initialDueDate, onSubmit, onCancel }) {
  const [title, setTitle] = React.useState(initialTitle);
  const [dueDate, setDueDate] = React.useState<Date | null>(initialDueDate);

  const valid = React.useMemo(() => {
    return title.length > 0 && dueDate;
  }, [title, dueDate]);

  const addMilestone = React.useCallback(async () => {
    if (!valid) return;
    if (!dueDate) return;

    await onSubmit(id, title, dueDate);

    close();
  }, [valid, title, dueDate]);

  return (
    <div className="bg-surface px-3 py-3 border border-surface-outline rounded">
      <div className="uppercase text-xs mb-2">{formTitle}</div>

      <div className="flex items-center gap-2 ">
        <div className="w-2/3 shrink-0">
          <input
            type="text"
            autoFocus
            className="w-full bg-surface-accent rounded px-2 py-1 outline-none border border-surface-outline ring-0"
            placeholder="ex. Website launch"
            value={title}
            data-test-id="new-milestone-title"
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="w-1/3 flex items-center gap-2">
          <div className="flex-1">
            <DateSelector
              date={dueDate}
              onChange={setDueDate}
              minDate={form.startTime}
              maxDate={form.dueDate}
              placeholder="Select due date"
              testID="new-milestone-due"
            />
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Button
          size="small"
          type="submit"
          variant="success"
          onClick={addMilestone}
          disabled={!valid}
          data-test-id="save-milestone-button"
        >
          Save
        </Button>
        <Button size="small" type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
