import * as React from "react";
import * as TipTapEditor from "@/components/Editor";
import * as People from "@/models/people";
import * as Tasks from "@/models/tasks";

import classnames from "classnames";

import { FilledButton } from "@/components/Button";
import { MultiPeopleSearch } from "./MultiPeopleSearch";

import ReactModal from "react-modal";

import { useColorMode } from "@/theme";

function useForm({ onSubmit, milestone }) {
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
    className: "min-h-[250px] p-2 py-1",
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
      assignee_ids: assignees.map((a) => a.id),
      milestone_id: milestone.id,
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
    },

    submit,
    cancel: reset,
    errors,
  };
}

export function NewTaskModal({ isOpen, hideModal, modalTitle, milestone, onSubmit }) {
  const handleSubmit = () => {
    onSubmit();
    hideModal();
  };

  const handleCancel = () => {
    form.cancel();
    hideModal();
  };

  const form = useForm({ onSubmit: handleSubmit, milestone });

  return (
    <Modal title={modalTitle} isOpen={isOpen}>
      <Form form={form} />

      <div className="flex justify-end mt-8">
        <div className="flex items-center gap-2">
          <FilledButton size="base" type="secondary" onClick={handleCancel}>
            Cancel
          </FilledButton>

          <FilledButton size="base" type="primary" onClick={form.submit}>
            Add Task
          </FilledButton>
        </div>
      </div>
    </Modal>
  );
}

function Form({ form }: { form: ReturnType<typeof useForm> }) {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-lg font-bold">Adding a new task</h1>

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
              data-test-id="new-milestone-title"
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
          />
        </div>
      </div>

      <TipTapEditor.Root editor={form.fields.descriptionEditor}>
        <div className="border-x border-b border-stroke-base flex-1">
          <TipTapEditor.Toolbar editor={form.fields.descriptionEditor} />
          <TipTapEditor.EditorContent editor={form.fields.descriptionEditor} />
        </div>
      </TipTapEditor.Root>
    </div>
  );
}

export function Modal({ isOpen, title, children }: { isOpen: boolean; title: string; children: React.ReactNode }) {
  const mode = useColorMode();
  const width = 800;

  return (
    <ReactModal
      isOpen={isOpen}
      contentLabel={title}
      ariaHideApp={false}
      style={{
        overlay: {
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: mode === "light" ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.7)",
          zIndex: 999,
        },
        content: {
          padding: "32px",
          top: "0px",
          left: "50%",
          width: `${width}px`,
          height: "auto",
          marginTop: "200px",
          marginLeft: `-${width / 2}px`,
          borderRadius: "8px",
          overflow: "scroll-y",
          bottom: "auto",
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-surface-outline)",
          boxShadow: "0px 0px 30px 0px rgba(0,0,0,0.4)",
        },
      }}
    >
      {children}
    </ReactModal>
  );
}
