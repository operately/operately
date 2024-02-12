import React from "react";
import classnames from "classnames";

import PeopleSearch from "@/components/PeopleSearch";

import { Modal } from "./Modal";
import { FilledButton } from "@/components/Button";
import { DateSelector } from "@/pages/ProjectEditTimelinePage/DateSelector";

import * as TipTapEditor from "@/components/Editor";
import * as People from "@/graphql/People";
import * as Forms from "@/components/Form";
import * as Tasks from "@/models/tasks";

function useForm({ onSubmit, group }) {
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
          spaceId: group.id,
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

export function NewTaskModal({ isOpen, hideModal, modalTitle, group, onSubmit }) {
  const handleSubmit = () => {
    onSubmit();
    hideModal();
  };

  const form = useForm({ onSubmit: handleSubmit, group });

  return (
    <Modal title={modalTitle} isOpen={isOpen} hideModal={hideModal}>
      <div className="my-4">
        <Form form={form} />
      </div>

      <div className="flex justify-end border-t border-surface-outline -mx-5 pt-3 px-4 -mb-2">
        <div className="flex items-center gap-2">
          <FilledButton size="xs" type="secondary" onClick={hideModal}>
            Cancel
          </FilledButton>

          <FilledButton size="xs" type="primary" onClick={form.submit}>
            Create
          </FilledButton>
        </div>
      </div>
    </Modal>
  );
}

function Form({ form }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide mb-1 mt-2">Name</div>
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

      <div className="text-xs uppercase tracking-wide mt-4 mb-1">Description (optional)</div>
      <TipTapEditor.Root editor={form.fields.descriptionEditor}>
        <div className="border-x border-b border-stroke-base flex-1">
          <TipTapEditor.Toolbar editor={form.fields.descriptionEditor} />
          <TipTapEditor.EditorContent editor={form.fields.descriptionEditor} />
        </div>
      </TipTapEditor.Root>

      <div className="grid grid-cols-4 gap-4 mt-4">
        <div>
          <div className="text-xs uppercase tracking-wide mb-1">Due Date</div>
          <div className="flex-1">
            <DateSelector
              date={form.fields.dueDate}
              onChange={form.fields.setDueDate}
              minDate={null}
              maxDate={null}
              placeholder="Select due date"
              testID="new-milestone-due"
              error={form.errors.includes("dueDate")}
            />
          </div>
        </div>

        <div>
          {" "}
          <Forms.SelectBox
            label="Priority"
            value={form.fields.priority}
            onChange={form.fields.setPriority}
            options={form.fields.priorityOptions}
            defaultValue={null}
            error={!!form.errors.find((e) => e.includes("priority"))}
          />
        </div>

        <div>
          <Forms.SelectBox
            label="Size"
            value={form.fields.size}
            onChange={form.fields.setSize}
            options={form.fields.sizeOptions}
            defaultValue={null}
            error={!!form.errors.find((e) => e.includes("size"))}
          />
        </div>

        <div>
          <AssigneeSearch
            title="Assignee"
            onSelect={form.fields.setAssignee}
            defaultValue={form.fields.assignee}
            error={form.errors.find((e) => e.field === "assignee")}
            inputId="assignee-search"
          />
        </div>
      </div>
    </div>
  );
}

function AssigneeSearch({ title, onSelect, defaultValue, inputId, error }: any) {
  const loader = People.usePeopleSearch();

  return (
    <div>
      <label className="font-semibold block mb-1">{title}</label>
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
    </div>
  );
}
