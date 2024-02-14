import * as React from "react";
import * as TipTapEditor from "@/components/Editor";
import * as People from "@/graphql/People";
import * as Tasks from "@/models/tasks";

import classnames from "classnames";

import { FilledButton } from "@/components/Button";

import PeopleSearch from "@/components/PeopleSearch";
import ReactModal from "react-modal";

import { useColorMode } from "@/theme";

function useForm({ onSubmit, milestone }) {
  const [name, setName] = React.useState("");
  const [dueDate, setDueDate] = React.useState(null);
  const [assignee, setAssignee] = React.useState(null);

  const [priority, setPriority] = React.useState({ value: "low", label: "Low" });
  const priorityOptions = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
    { value: "urgent", label: "Urgent" },
  ];

  const [size, setSize] = React.useState({ value: "small", label: "Small" });
  const sizeOptions = [
    { value: "small", label: "Small" },
    { value: "medium", label: "Medium" },
    { value: "large", label: "Large" },
  ];

  const { editor } = TipTapEditor.useEditor({
    autoFocus: false,
    placeholder: "Write here...",
    peopleSearch: People.usePeopleSearch(),
    className: "min-h-[250px] p-2 py-1",
  });

  const [create, { loading }] = Tasks.useCreateTaskMutation({
    onCompleted: () => onSubmit(),
  });

  const submit = () => {
    create({
      variables: {
        input: {
          name,
          dueDate,
          description: JSON.stringify(editor.getJSON()),
          priority: priority.value,
          size: size.value,
          assignee_id: assignee?.id,
          milestone_id: milestone.id,
        },
      },
    });
  };

  return {
    fields: {
      name,
      dueDate,
      descriptionEditor: editor,
      priority,
      priorityOptions,
      size,
      sizeOptions,
      assignee,

      setName,
      setDueDate,
      setPriority,
      setSize,
      setAssignee,
    },
    submit: submit,
    errors: [],
  };
}

export function NewTaskModal({ isOpen, hideModal, modalTitle, milestone, onSubmit }) {
  const handleSubmit = () => {
    onSubmit();
    hideModal();
  };

  const form = useForm({ onSubmit: handleSubmit, milestone });

  return (
    <Modal title={modalTitle} isOpen={isOpen} hideModal={hideModal}>
      <Form form={form} />

      <div className="flex justify-end mt-8">
        <div className="flex items-center gap-2">
          <FilledButton size="base" type="secondary" onClick={hideModal}>
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

function Form({ form }) {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-lg font-bold">Adding a new task</h1>

      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div className="font-bold w-24 shrink-0">Title</div>
          <div className="">
            <input
              autoFocus
              type="text"
              className={classnames(
                "w-full bg-surface px-2 py-1 outline-none border border-stroke-base ring-0 placeholder-content-dimmed",
                {
                  "border-red-500": form.errors.includes("name"),
                },
              )}
              placeholder="Name"
              value={form.fields.name}
              data-test-id="new-milestone-title"
              onChange={(e) => form.fields.setName(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="font-bold w-24 shrink-0">Assignees</div>

          <input
            type="text"
            className={classnames(
              "w-full bg-surface px-2 py-1 outline-none border border-stroke-base ring-0 placeholder-content-dimmed",
              {
                "border-red-500": form.errors.includes("name"),
              },
            )}
            placeholder="Name"
            value={form.fields.name}
            data-test-id="new-milestone-title"
            onChange={(e) => form.fields.setName(e.target.value)}
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

function AssigneeSearch({ title, onSelect, defaultValue, inputId, error }: any) {
  const loader = People.usePeopleSearch();

  return (
    <div className="flex-1">
      <PeopleSearch
        onChange={(option) => onSelect(option?.person)}
        defaultValue={defaultValue}
        placeholder="Search for person..."
        inputId={inputId}
        loader={loader}
        error={!!error}
      />
    </div>
  );
}

export function Modal({ isOpen, hideModal, title, children, minHeight = "600px" }) {
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
