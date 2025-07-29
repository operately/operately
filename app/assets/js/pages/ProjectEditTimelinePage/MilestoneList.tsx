import * as React from "react";

import * as TipTapEditor from "@/components/Editor";
import { IconPlus, IconFlag3Filled, IconPencil, IconTrash, DateField } from "turboui";

import classNames from "classnames";

import { PrimaryButton, SecondaryButton } from "turboui";
import { Summary } from "@/components/RichContent";
import { FormState } from "./useForm";
import { ParsedMilestone } from "@/models/milestones";

export function MilestoneList({ form }: { form: FormState }) {
  const milestones = form.milestoneList.milestones.sort((m1, m2) => {
    const d1 = m1.deadline ? +m1.deadline.date : Number.MAX_SAFE_INTEGER;
    const d2 = m2.deadline ? +m2.deadline.date : Number.MAX_SAFE_INTEGER;

    return d1 - d2;
  });

  return (
    <div className="flex flex-col gap-2 my-3">
      {milestones.map((m) => (
        <MilestoneListItem key={m.id} milestone={m} form={form} />
      ))}

      <AddMilestone form={form} />
    </div>
  );
}

function AddMilestone({ form }: { form: FormState }) {
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

function AddMilestoneButton({ onClick }: { onClick: () => void }) {
  return (
    <div
      className="py-2 px-3 border border-surface-outline bg-surface-accent rounded cursor-pointer hover:bg-surface-dimmed"
      onClick={onClick}
      data-test-id="add-milestone"
    >
      <div className="flex flex-col flex-1">
        <div className="flex items-center gap-1 text-content-dimmed font-medium">
          <IconPlus size={16} className="text-content-dimmed shrink-0" />
          Add milestone
        </div>
      </div>
    </div>
  );
}

function AddMilestoneForm({ form, close }: { form: FormState; close: () => void }) {
  const onSubmit = React.useCallback(
    async (id: string, title: string, deadline: DateField.ContextualDate, description: any) => {
      form.milestoneList.add({
        id: id,
        title,
        description: description,
        deadline,
        deletable: true,
      });

      close();
    },
    [],
  );

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

function MilestoneListItem({ milestone, form }: { milestone: ParsedMilestone; form: FormState }) {
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

interface MilestoneDisplayProps {
  milestone: ParsedMilestone;
  form: FormState;
  edit: () => void;
}

function MilestoneDisplay({ milestone, form, edit }: MilestoneDisplayProps) {
  return (
    <div
      className="py-2 px-3 border border-surface-outline bg-surface-accent rounded"
      data-test-id={milestoneTestID(milestone) + "-due"}
    >
      <div className="flex items-start justify-between">
        <div className="flex flex-col flex-1">
          <div className="font-bold flex items-center gap-1">
            <IconFlag3Filled size={16} className="shrink-0" />
            {milestone.title}
          </div>

          <div className="text-sm max-w-lg mb-2">
            {milestone.description && <Summary jsonContent={milestone.description} characterCount={200} />}
          </div>

          <div className="text-sm flex items-center gap-1">
            Deadline: <DateField date={milestone.deadline} readonly hideCalendarIcon />
          </div>
        </div>

        {form.milestoneBeingEdited === null && (
          <div className="flex items-center gap-2 -mr-1.5">
            <div
              className="rounded-full bg-surface-dimmed hover:bg-surface-accent p-1 cursor-pointer hover:text-accent-1 transition-colors"
              onClick={edit}
              data-test-id={"edit-" + milestoneTestID(milestone)}
            >
              <IconPencil size={16} />
            </div>

            {milestone.deletable && (
              <div
                className="rounded-full bg-surface-dimmed hover:bg-surface-accent p-1 cursor-pointer hover:text-content-error transition-colors"
                onClick={() => form.milestoneList.remove(milestone.id)}
                data-test-id={"remove-" + milestoneTestID(milestone)}
              >
                <IconTrash size={16} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function MilestoneEdit({ milestone, form, close }: { milestone: ParsedMilestone; form: FormState; close: () => void }) {
  const onSubmit = React.useCallback(
    async (id: string, title: string, deadline: DateField.ContextualDate, description: any) => {
      await form.milestoneList.edit({
        id: id,
        title,
        description: description,
        deadline: deadline,
      });

      close();
    },
    [],
  );

  return (
    <MilestoneForm
      form={form}
      id={milestone.id}
      initialTitle={milestone.title}
      initialDueDate={milestone.deadline}
      initialDescription={milestone.description && JSON.parse(milestone.description)}
      onSubmit={onSubmit}
      onCancel={close}
    />
  );
}

function milestoneTestID(milestone: ParsedMilestone) {
  return "milestone-" + milestone.title!.toLowerCase().replace(/\s+/g, "-");
}

interface MilestoneFormProps {
  form: FormState;
  id: string;
  initialTitle: string;
  initialDueDate: DateField.ContextualDate | null;
  initialDescription: any;
  onSubmit: (id: string, title: string, deadline: DateField.ContextualDate | null, description: any) => void;
  onCancel: () => void;
}

function MilestoneForm({
  form,
  id,
  initialTitle,
  initialDueDate,
  initialDescription,
  onSubmit,
  onCancel,
}: MilestoneFormProps) {
  const [title, setTitle] = React.useState(initialTitle);
  const [dueDate, setDueDate] = React.useState<DateField.ContextualDate | null>(initialDueDate);

  const { editor } = TipTapEditor.useEditor({
    autoFocus: false,
    placeholder: "Write here...",
    className: "min-h-[150px] p-2 py-1 text-sm",
    content: initialDescription,
    mentionSearchScope: { type: "project", id: form.projectId },
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
    <div className="border border-surface-outline rounded bg-surface-base p-3 shadow-xl">
      <div className="text-xs uppercase tracking-wide mb-1 mt-2">Title</div>
      <div className="">
        <input
          autoFocus
          type="text"
          className={classNames(
            "w-full bg-surface-base px-2 py-1 outline-none border border-stroke-base ring-0 placeholder-content-dimmed",
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
        <DateField
          date={dueDate}
          onDateSelect={setDueDate}
          minDateLimit={form.startTime?.date}
          maxDateLimit={form.dueDate?.date}
          placeholder="Select due date"
          variant="form-field"
          testId="new-milestone-due"
          // error={errors.includes("dueDate")}
        />
        {errors.includes("dueDate") && (
          <div className="text-red-500 text-xs mt-1" data-test-id="due-date-error">
            Due date is required
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2 justify-end border-t border-stroke-base pt-2">
        <SecondaryButton size="sm" onClick={onCancel}>
          Cancel
        </SecondaryButton>

        <PrimaryButton size="sm" onClick={addMilestone} testId="save-milestone-button">
          Save
        </PrimaryButton>
      </div>
    </div>
  );
}
