import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as Groups from "@/models/groups";
import * as Icons from "@tabler/icons-react";
import * as Forms from "@/components/Form";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as TipTapEditor from "@/components/Editor";

import RichContent from "@/components/RichContent";
import FormattedTime from "@/components/FormattedTime";
import Avatar from "@/components/Avatar";
import { FilledButton } from "@/components/Button";

import { useLoadedData } from "./loader";
import { useForm, FormState } from "./useForm";

import { OpenBadge, ClosedBadge, PriorityBadge, SizeBadge } from "@/features/Tasks/Badges";

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

          <div className="flex gap-4 justify-between">
            <div className="w-2/3 pl-10 py-4">
              <div className="font-medium">
                <Description form={form} />
              </div>
            </div>

            <div className="w-1/3 flex flex-col border-l border-surface-outline">
              <div className="p-3 border-b border-stroke-base">
                <div className="uppercase font-medium text-xs text-content-dimmed">Assignees</div>
                <AssignedPeople form={form} />
              </div>

              <div className="p-3 border-b border-stroke-base">
                <div className="uppercase font-medium text-xs text-content-dimmed">Status</div>
                <div className="flex items-center gap-2 mt-1">
                  {form.status.status === "open" ? <OpenBadge /> : <ClosedBadge />}
                </div>
              </div>

              <div className="p-3 border-b border-stroke-base">
                <div className="uppercase font-medium text-xs text-content-dimmed">Due Date</div>
                <div className="forn-medium mt-1">
                  <FormattedTime time={task.dueDate} format="short-date" />
                </div>
              </div>

              <div className="p-3 border-b border-stroke-base">
                <div className="uppercase font-medium text-xs text-content-dimmed">Priority</div>
                <Priority form={form} />
              </div>

              <div className="p-3 border-b border-stroke-base">
                <div className="uppercase font-medium text-xs text-content-dimmed">Size</div>
                <Size form={form} />
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

function Priority({ form }: { form: FormState }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <PriorityBadge priority={form.priority.priority} />
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="bg-surface border border-surface-outline shadow rounded-lg flex flex-col justify-start items-start"
          sideOffset={5}
        >
          <DropdownMenu.Item
            className="px-2 py-1 border-b border-stroke-base w-full cursor-pointer hover:bg-surface-highlight"
            onClick={() => form.priority.change("low")}
          >
            <PriorityBadge priority="low" />
          </DropdownMenu.Item>

          <DropdownMenu.Item
            className="px-2 py-1 border-b border-stroke-base w-full cursor-pointer hover:bg-surface-highlight"
            onClick={() => form.priority.change("medium")}
          >
            <PriorityBadge priority="medium" />
          </DropdownMenu.Item>

          <DropdownMenu.Item
            className="px-2 py-1 border-b border-stroke-base w-full cursor-pointer hover:bg-surface-highlight"
            onClick={() => form.priority.change("high")}
          >
            <PriorityBadge priority="high" />
          </DropdownMenu.Item>

          <DropdownMenu.Item
            className="px-2 py-1 border-b border-stroke-base w-full cursor-pointer hover:bg-surface-highlight"
            onClick={() => form.priority.change("urgent")}
          >
            <PriorityBadge priority="urgent" />
          </DropdownMenu.Item>

          <DropdownMenu.Arrow className="fill-white" />
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function Size({ form }: { form: FormState }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <SizeBadge size={form.size.size} />
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="bg-surface border border-surface-outline shadow rounded-lg flex flex-col justify-start items-start"
          sideOffset={5}
        >
          <DropdownMenu.Item
            className="px-2 py-1 border-b border-stroke-base w-full cursor-pointer hover:bg-surface-highlight"
            onClick={() => form.size.change("small")}
          >
            <SizeBadge size="small" />
          </DropdownMenu.Item>

          <DropdownMenu.Item
            className="px-2 py-1 border-b border-stroke-base w-full cursor-pointer hover:bg-surface-highlight"
            onClick={() => form.size.change("medium")}
          >
            <SizeBadge size="medium" />
          </DropdownMenu.Item>

          <DropdownMenu.Item
            className="px-2 py-1 border-b border-stroke-base w-full cursor-pointer hover:bg-surface-highlight"
            onClick={() => form.size.change("large")}
          >
            <SizeBadge size="large" />
          </DropdownMenu.Item>

          <DropdownMenu.Arrow className="fill-white" />
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
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
    <div>
      <div className="uppercase font-medium text-xs text-content-dimmed mb-2">Description</div>

      <TipTapEditor.Root editor={form.description.editor}>
        <div className="border-x border-b border-stroke-base flex-1">
          <TipTapEditor.Toolbar editor={form.description.editor} />
          <TipTapEditor.EditorContent editor={form.description.editor} />
        </div>

        <div className="flex gap-2 mt-2 justify-end">
          <FilledButton size="xxs" type="secondary" onClick={form.description.cancel}>
            Cancel
          </FilledButton>

          <FilledButton size="xxs" type="primary" onClick={form.description.submit}>
            Save
          </FilledButton>
        </div>
      </TipTapEditor.Root>
    </div>
  );
}

function DescriptionDisplay({ form }: { form: FormState }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <div className="uppercase font-medium text-xs text-content-dimmed">Description</div>
        <FilledButton size="xxs" type="secondary" onClick={() => form.description.setEditing(true)}>
          Edit
        </FilledButton>
      </div>
      <RichContent jsonContent={form.description.description!} />
    </div>
  );
}

function AssignedPeople({ form }: { form: FormState }) {
  return (
    <div>
      {form.assignedPeople.people.map((person) => (
        <div className="flex items-center gap-2 mt-1" key={person.id}>
          <Avatar person={person} size={20} />
          <div className="forn-medium">{person.fullName}</div>
        </div>
      ))}

      <div className="flex items-center gap-2 mt-4">
        <FilledButton size="xxs" type="secondary">
          Add
        </FilledButton>
      </div>
    </div>
  );
}
