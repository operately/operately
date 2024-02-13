import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as Groups from "@/models/groups";
import * as Icons from "@tabler/icons-react";
import * as Forms from "@/components/Form";

import RichContent from "@/components/RichContent";
import FormattedTime from "@/components/FormattedTime";
import Avatar from "@/components/Avatar";
import { FilledButton } from "@/components/Button";

import { useLoadedData } from "./loader";
import { useForm, FormState } from "./useForm";

import { OpenBadge, ClosedBadge } from "@/features/Tasks/Badges";

export function Page() {
  const { task } = useLoadedData();

  const form = useForm(task);

  return (
    <Pages.Page title={[task.name]}>
      <Paper.Root size="large">
        <Navigation space={task.space} />

        <Paper.Body noPadding>
          <div className="flex items-start justify-between border-b border-surface-outline px-10 pt-6 pb-4">
            <Name form={form} />
            <TopActions form={form} />
          </div>

          <div className="flex gap-8 justify-between items-start">
            <div className="w-2/3 pl-10 pt-4">
              <div className="font-medium">
                <RichContent jsonContent={task.description!} />
              </div>
            </div>

            <div className="w-1/3 flex flex-col border-l border-surface-outline divide-y divide-stroke-base">
              <div className="p-3">
                <div className="uppercase font-medium text-xs text-content-dimmed">Status</div>
                <div className="flex items-center gap-2 mt-1">
                  {form.status.status === "open" ? <OpenBadge /> : <ClosedBadge />}
                </div>
              </div>

              <div className="p-3">
                <div className="uppercase font-medium text-xs text-content-dimmed">Assignee</div>
                <div className="flex items-center gap-2 mt-1">
                  <Avatar person={task.assignee!} size={20} />
                  <div className="forn-medium">{task.assignee ? task.assignee.fullName : "Unassigned"}</div>
                </div>
              </div>

              <div className="p-3">
                <div className="uppercase font-medium text-xs text-content-dimmed">Due Date</div>
                <div className="forn-medium mt-1">
                  <FormattedTime time={task.dueDate} format="short-date" />
                </div>
              </div>

              <div className="p-3">
                <div className="uppercase font-medium text-xs text-content-dimmed">Priority</div>
                <div className="forn-medium mt-1 capitalize">{task.priority}</div>
              </div>

              <div className="p-3">
                <div className="uppercase font-medium text-xs text-content-dimmed">Size</div>
                <div className="forn-medium mt-1 capitalize">{task.size}</div>
              </div>
            </div>
          </div>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

export function Navigation({ space }: { space: Groups.Group }) {
  return (
    <Paper.Navigation>
      <Paper.NavItem linkTo={`/spaces/${space.id}/tasks`}>
        {React.createElement(Icons[space.icon], { size: 16, className: space.color })}
        {space.name}
      </Paper.NavItem>
    </Paper.Navigation>
  );
}

function Name({ form }: { form: FormState }) {
  if (form.name.editing) {
    return <NameEditor form={form} />;
  } else {
    return <NameDisplay form={form} />;
  }
}

function NameEditor({ form }: { form: FormState }) {
  return (
    <div className="flex-1 flex items-center gap-2">
      <Forms.TextInputNoLabel
        id="task-name"
        value={form.name.name}
        onChange={form.name.setName}
        onEnter={form.name.submit}
        autoFocus
        placeholder="Task Name"
        error={form.name.error}
      />

      <FilledButton size="sm" type="secondary" onClick={form.name.cancel}>
        Cancel
      </FilledButton>

      <FilledButton size="sm" type="primary" onClick={form.name.submit} bzzzOnClickFailure>
        Save
      </FilledButton>
    </div>
  );
}

function NameDisplay({ form }: { form: FormState }) {
  return <div className="font-bold text-2xl break-all pr-2">{form.name.name}</div>;
}

function TopActions({ form }: { form: FormState }) {
  if (form.name.editing) return null;

  return (
    <div className="flex gap-2 items-center shrink-0">
      <FilledButton size="xs" type="secondary" onClick={() => form.name.setEditing(true)}>
        Edit
      </FilledButton>

      {form.status.status === "open" ? <MarkAsDoneButton form={form} /> : <ReopenButton form={form} />}
    </div>
  );
}

function MarkAsDoneButton({ form }: { form: FormState }) {
  return (
    <FilledButton size="xs" type="primary" onClick={form.status.close}>
      Mark as Done
    </FilledButton>
  );
}

function ReopenButton({ form }: { form: FormState }) {
  return (
    <FilledButton size="xs" type="primary" onClick={form.status.reopen}>
      Reopen
    </FilledButton>
  );
}
