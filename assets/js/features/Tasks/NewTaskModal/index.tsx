import * as React from "react";
import * as TipTapEditor from "@/components/Editor";
import * as People from "@/models/people";
import * as Tasks from "@/models/tasks";
import * as Milestones from "@/models/milestones";

import classnames from "classnames";
import Modal from "@/components/Modal";

import { PrimaryButton, SecondaryButton } from "@/components/Buttons";
import { MultiPeopleSearch } from "./MultiPeopleSearch";

interface UseFormProps {
  onSubmit: () => void;
  milestone: Milestones.Milestone;
  mentionSearchScope: People.SearchScope;
}

function useForm({ onSubmit, milestone, mentionSearchScope }: UseFormProps) {
  const [name, setName] = React.useState("");
  const [assignees, setAssignees] = React.useState<People.Person[]>([]);
  const [errors, setErrors] = React.useState<string[]>([]);

  const reset = React.useCallback(() => {
    setName("");
    setAssignees([]);
    setErrors([]);
  }, []);

  const { editor } = TipTapEditor.useEditor({
    autoFocus: false,
    placeholder: "Add a description here...",
    className: "flex-1 p-2 py-1",
    mentionSearchScope: mentionSearchScope,
  });

  const [create] = Tasks.useCreateTask();

  const submit = async (): Promise<boolean> => {
    if (!name) {
      setErrors((errors) => [...errors, "name"]);
      return false;
    }

    await create({
      name,
      description: JSON.stringify(editor.getJSON()),
      assigneeIds: assignees.map((a) => a.id!),
      milestoneId: milestone.id,
    });

    reset();
    onSubmit();

    return true;
  };

  return {
    fields: {
      name,
      descriptionEditor: editor,
      assignees,

      setName,
      setAssignees,
      mentionSearchScope,
    },

    submit,
    cancel: reset,
    errors,
  };
}

interface NewTaskModalProps {
  isOpen: boolean;
  hideModal: () => void;
  modalTitle: string;
  onSubmit: () => void;
  milestone: Milestones.Milestone;
}

export function NewTaskModal({ isOpen, hideModal, milestone, onSubmit }: NewTaskModalProps) {
  const handleSubmit = () => {
    onSubmit();
    hideModal();
  };

  const handleCancel = () => {
    form.cancel();
    hideModal();
  };

  const form = useForm({
    onSubmit: handleSubmit,
    milestone,
    mentionSearchScope: { type: "project", id: milestone.project!.id! },
  });

  return (
    <Modal title="Add Task" isOpen={isOpen} hideModal={handleCancel} size="lg" height="600px">
      <Form form={form} handleCancel={handleCancel} />
    </Modal>
  );
}

function Form({ form, handleCancel }: { form: ReturnType<typeof useForm>; handleCancel: () => void }) {
  return (
    <div className="flex flex-col gap-6 flex-1 h-full">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div className="font-bold w-24 shrink-0">Title</div>
          <div className="flex-1">
            <input
              autoFocus
              type="text"
              className={classnames({
                "w-full px-2 py-1 placeholder-content-dimmed bg-surface-highlight font-medium": true,
                "outline-none ring-0 border-none focus:outline-none focus:ring-0": true,
                "bg-red-100": form.errors.includes("name"),
              })}
              placeholder="Title of the task"
              value={form.fields.name}
              data-test-id="new-task-title"
              onChange={(e) => form.fields.setName(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="font-bold w-24 shrink-0">Assignees</div>
          <MultiPeopleSearch
            visuals="minimal"
            addedPeople={form.fields.assignees}
            setAddedPeople={form.fields.setAssignees}
            searchScope={form.fields.mentionSearchScope}
          />
        </div>
      </div>

      <TipTapEditor.Root editor={form.fields.descriptionEditor} className="flex-1">
        <div className="border-x border-b border-stroke-base h-full">
          <TipTapEditor.Toolbar editor={form.fields.descriptionEditor} />
          <TipTapEditor.EditorContent editor={form.fields.descriptionEditor} />
        </div>
      </TipTapEditor.Root>

      <div className="flex justify-end">
        <div className="flex items-center gap-2">
          <SecondaryButton size="sm" onClick={handleCancel}>
            Cancel
          </SecondaryButton>

          <PrimaryButton size="sm" onClick={form.submit} testId="submit-new-task">
            Add Task
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
