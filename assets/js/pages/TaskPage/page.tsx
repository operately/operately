import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as Tasks from "@/models/tasks";
import * as Forms from "@/components/Form";
import * as Icons from "@tabler/icons-react";
import * as TipTapEditor from "@/components/Editor";

import RichContent from "@/components/RichContent";
import Avatar from "@/components/Avatar";
import { FilledButton } from "@/components/Button";

import { useLoadedData } from "./loader";
import { useForm, FormState } from "./useForm";
import { isContentEmpty } from "@/components/RichContent/isContentEmpty";

export function Page() {
  const { task } = useLoadedData();

  const form = useForm(task);

  return (
    <Pages.Page title={[task.name]}>
      <Paper.Root size="medium">
        <Navigation task={task} />

        <Paper.Body noPadding>
          <Header form={form} />

          <div className="flex justify-center">
            <TopActions form={form} />
          </div>

          <PageSection title="Description" color="bg-yellow-300">
            <EditDescription form={form} color="bg-yellow-300" />
          </PageSection>
          <Description form={form} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

export function Navigation({ task }: { task: Tasks.Task }) {
  const projectPath = `/projects/${task.project.id}`;
  const milestonePath = `/projects/${task.project.id}/milestones/${task.milestone.id}`;

  return (
    <Paper.Navigation>
      <Paper.NavItem linkTo={projectPath}>{task.project.name}</Paper.NavItem>
      <Paper.NavSeparator />
      <Paper.NavItem linkTo={milestonePath}>{task.milestone.title}</Paper.NavItem>
    </Paper.Navigation>
  );
}

function Header({ form }: { form: FormState }) {
  if (form.name.editing) {
    return <HeaderEditor form={form} />;
  } else {
    return <HeaderDisplay form={form} />;
  }
}

function HeaderEditor({ form }: { form: FormState }) {
  return (
    <div className="mx-10 mt-8">
      <div className="w-full">
        <Forms.TextInput
          id="task-name"
          label="Task Name"
          value={form.name.name}
          onChange={form.name.setName}
          onEnter={form.name.submit}
          autoFocus
          placeholder="Task Name"
          error={form.name.error}
        />
      </div>
      <div className="flex gap-2 mt-4 justify-end">
        <FilledButton size="sm" type="secondary" onClick={form.name.cancel}>
          Cancel
        </FilledButton>

        <FilledButton size="sm" type="primary" onClick={form.name.submit} bzzzOnClickFailure>
          Save
        </FilledButton>
      </div>
    </div>
  );
}

function HeaderDisplay({ form }: { form: FormState }) {
  return (
    <div className="flex flex-col items-center justify-center mb-4 my-8 mx-10">
      <div className="text-3xl font-extrabold text-content-accent text-center mt-4 mb-2">{form.name.name}</div>
      <AssignedPeopleList form={form} />
    </div>
  );
}

function TopActions({ form }: { form: FormState }) {
  if (form.name.editing) return null;

  return (
    <div className="flex gap-2 items-center shrink-0">
      {form.status.status === "open" ? <MarkAsDoneButton form={form} /> : <ReopenButton form={form} />}

      <FilledButton size="sm" type="secondary" onClick={() => form.name.setEditing(true)}>
        Edit
      </FilledButton>
    </div>
  );
}

function MarkAsDoneButton({ form }: { form: FormState }) {
  return (
    <FilledButton size="sm" type="primary" onClick={form.status.close}>
      Mark as Done
    </FilledButton>
  );
}

function ReopenButton({ form }: { form: FormState }) {
  return (
    <FilledButton size="sm" type="primary" onClick={form.status.reopen}>
      Reopen
    </FilledButton>
  );
}

function Description({ form }: { form: FormState }) {
  if (form.description.editing) {
    return <DescriptionEditor form={form} />;
  } else {
    return <DescriptionDisplay form={form} />;
  }
}

function DescriptionEditor({ form }: { form: FormState }) {
  return (
    <div className="mx-10 mb-8">
      <TipTapEditor.Root editor={form.description.editor}>
        <div className="border-x border-b border-stroke-base flex-1">
          <TipTapEditor.Toolbar editor={form.description.editor} />
          <TipTapEditor.EditorContent editor={form.description.editor} />
        </div>

        <div className="flex gap-2 mt-2 justify-end">
          <FilledButton size="xs" type="secondary" onClick={form.description.cancel}>
            Cancel
          </FilledButton>

          <FilledButton size="xs" type="primary" onClick={form.description.submit}>
            Save
          </FilledButton>
        </div>
      </TipTapEditor.Root>
    </div>
  );
}

function DescriptionDisplay({ form }: { form: FormState }) {
  if (isContentEmpty(form.description.description)) {
    return (
      <div className="flex items-center gap-2 mx-10 mb-8">
        <FilledButton
          onClick={() => form.description.setEditing(true)}
          testId="add-milestone-description"
          size="xs"
          type="secondary"
        >
          Add Description
        </FilledButton>
      </div>
    );
  } else {
    return (
      <div className="mx-10 mb-8">
        <RichContent jsonContent={form.description.description!} />
      </div>
    );
  }
}

function AssignedPeopleList({ form }: { form: FormState }) {
  if (form.assignedPeople.people.length === 0) {
    return <div className="text-content-dimmed mt-0.5">No one is assigned to this task</div>;
  }

  return (
    <div className="flex items-center gap-2 flex-wrap mx-10">
      {form.assignedPeople.people.map((person) => (
        <div className="flex items-center gap-1" key={person.id}>
          <Avatar person={person} size={32} />
        </div>
      ))}
    </div>
  );
}

function PageSection({ title, color, children = null }: { title: string; color: string; children?: React.ReactNode }) {
  const textColor = "text-dark-1";

  return (
    <div className="mt-8 mb-4 flex items-center">
      <div className="border-t border-surface-outline w-10" />
      <div className={"text-sm font-bold rounded px-1.5 tracking-wide" + " " + color + " " + textColor}>{title}</div>
      {children}
      <div className="border-t border-surface-outline flex-1" />
    </div>
  );
}

function EditDescription({ form, color }) {
  const textColor = "text-dark-1";

  return (
    <>
      <div className="border-t border-surface-outline w-2" />
      <div
        className={
          "text-sm font-bold rounded-full p-1 hover:scale-110 transition cursor-pointer" + " " + color + " " + textColor
        }
        onClick={() => form.description.setEditing(true)}
      >
        <Icons.IconPencil size={12} />
      </div>
    </>
  );
}
