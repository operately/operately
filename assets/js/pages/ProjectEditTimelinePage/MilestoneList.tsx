import * as React from "react";
import * as Milestones from "@/models/milestones";

import { FilledButton } from "@/components/Button";
import FormattedTime from "@/components/FormattedTime";
import * as TipTapEditor from "@/components/Editor";
import * as People from "@/models/people";

import * as Time from "@/utils/time";
import * as Icons from "@tabler/icons-react";

import { DateSelector } from "./DateSelector";
import classNames from "classnames";
import { Summary } from "@/components/RichContent";

export function MilestoneList({ form }) {
  const milestones = Milestones.sortByDeadline(form.milestoneList.milestones);

  return (
    <div className="flex flex-col gap-2 my-3">
      {milestones.map((m: Milestones.Milestone) => (
        <MilestoneListItem key={m.id} milestone={m} form={form} />
      ))}

      <AddMilestone form={form} />
    </div>
  );
}

function AddMilestone({ form }) {
  const [active, setActive] = React.useState(false);

  const startEditing = React.useCallback(() => {
    form.setMilestoneBeingEdited("new");
    setActive(true);
  }, []);

  const close = React.useCallback(() => {
    form.setMilestoneBeingEdited(null);

    setActive(false);
  }, []);

  if (active) {
    return <AddMilestoneForm form={form} close={close} />;
  } else {
    return form.milestoneBeingEdited ? null : <AddMilestoneButton onClick={startEditing} />;
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
  const onSubmit = React.useCallback(async (id: string, title: string, dueDate: Date, description: any) => {
    await form.milestoneList.add({
      id: id,
      title,
      description: description,
      deadlineAt: dueDate.toISOString(),
    });

    close();
  }, []);

  return (
    <MilestoneForm
      form={form}
      id={Math.random().toString(36)}
      initialTitle=""
      initialDueDate={null}
      initialDescription={null}
      onSubmit={onSubmit}
      onCancel={close}
    />
  );
}

function MilestoneListItem({ milestone, form }) {
  const [editing, setEditing] = React.useState(false);

  const edit = () => {
    form.setMilestoneBeingEdited(milestone.id);
    setEditing(true);
  };

  const close = () => {
    form.setMilestoneBeingEdited(null);
    setEditing(false);
  };

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
      <div className="flex items-start justify-between">
        <div className="flex flex-col flex-1">
          <div className="font-bold flex items-center gap-1">
            <Icons.IconFlag3Filled size={16} className="shrink-0" />
            {milestone.title}
          </div>

          <div className="text-sm max-w-lg mb-2">
            <Summary jsonContent={milestone.description} characterCount={200} />
          </div>

          <div className="text-sm">
            Deadline: <FormattedTime timezone={""} time={Time.parse(milestone.deadlineAt)!} format="short-date" />
          </div>
        </div>

        {form.milestoneBeingEdited === null && (
          <div className="flex items-center gap-2 -mr-1.5">
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
        )}
      </div>
    </div>
  );
}

function MilestoneEdit({ milestone, form, close }) {
  const onSubmit = React.useCallback(async (id: string, title: string, dueDate: Date, description: any) => {
    await form.milestoneList.edit({
      id: id,
      title,
      description: description,
      deadlineAt: dueDate.toISOString(),
    });

    close();
  }, []);

  return (
    <MilestoneForm
      form={form}
      id={milestone.id}
      initialTitle={milestone.title}
      initialDueDate={Time.parse(milestone.deadlineAt)}
      initialDescription={milestone.description && JSON.parse(milestone.description)}
      onSubmit={onSubmit}
      onCancel={close}
    />
  );
}

function milestoneTestID(milestone: Milestones.Milestone) {
  return "milestone-" + milestone.title.toLowerCase().replace(/\s+/g, "-");
}

function MilestoneForm({ form, id, initialTitle, initialDueDate, initialDescription, onSubmit, onCancel }) {
  const [title, setTitle] = React.useState(initialTitle);
  const [dueDate, setDueDate] = React.useState<Date | null>(initialDueDate);

  const { editor } = TipTapEditor.useEditor({
    autoFocus: false,
    placeholder: "Write here...",
    peopleSearch: People.usePeopleSearch(),
    className: "min-h-[150px] p-2 py-1 text-sm",
    content: initialDescription,
  });

  const [errors, setErrors] = React.useState<string[]>([]);

  const addMilestone = React.useCallback(async (): Promise<boolean> => {
    if (!editor) return false;

    const newErrors: string[] = [];

    if (title.trim().length === 0) {
      newErrors.push("title");
    }

    if (!dueDate) {
      newErrors.push("dueDate");
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return false;
    }

    await onSubmit(id, title, dueDate, JSON.stringify(editor.getJSON()));
    return true;
  }, [editor, title, dueDate]);

  return (
    <div className="border border-surface-outline rounded bg-surface p-3 shadow-xl">
      <div className="text-xs uppercase tracking-wide mb-1 mt-2">Title</div>
      <div className="">
        <input
          autoFocus
          type="text"
          className={classNames(
            "w-full bg-surface px-2 py-1 outline-none border border-stroke-base ring-0 placeholder-content-dimmed",
            {
              "border-red-500": errors.includes("title"),
            },
          )}
          placeholder="ex. Website launch"
          value={title}
          data-test-id="new-milestone-title"
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="text-xs uppercase tracking-wide mt-4 mb-1">Description (optional)</div>
      <TipTapEditor.Root editor={editor}>
        <div className="border-x border-b border-stroke-base flex-1">
          <TipTapEditor.Toolbar editor={editor} />
          <TipTapEditor.EditorContent editor={editor} />
        </div>
      </TipTapEditor.Root>

      <div className="text-xs uppercase tracking-wide mt-4 mb-1">Due Date</div>

      <div className="flex-1 w-64">
        <DateSelector
          date={dueDate}
          onChange={setDueDate}
          minDate={form.startTime}
          maxDate={form.dueDate}
          placeholder="Select due date"
          testID="new-milestone-due"
          error={errors.includes("dueDate")}
        />
      </div>

      <div className="mt-4 flex items-center gap-2 justify-end border-t border-stroke-base pt-2">
        <FilledButton size="sm" type="secondary" onClick={onCancel}>
          Cancel
        </FilledButton>

        <FilledButton size="sm" type="primary" onClick={addMilestone} testId="save-milestone-button" bzzzOnClickFailure>
          Save
        </FilledButton>
      </div>
    </div>
  );
}
