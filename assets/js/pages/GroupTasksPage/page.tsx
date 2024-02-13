import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as Companies from "@/models/companies";

import { ComingSoonBadge } from "@/components/ComingSoonBadge";
import { GroupPageNavigation } from "@/components/GroupPageNavigation";
import { FilledButton } from "@/components/Button";

import { useLoadedData, useRefresh } from "./loader";
import { NewTaskModal } from "./NewTaskModal";
import { Table } from "./Table";
import FormattedTime from "@/components/FormattedTime";
import { Link } from "@/components/Link";

import { OpenBadge, ClosedBadge } from "@/features/Tasks/Badges";

export function Page() {
  const { company, group } = useLoadedData();
  const refresh = useRefresh();

  const [newTaskModalOpen, setNewTaskModalOpen] = React.useState(false);

  if (Companies.hasFeature(company, "tasks") === false) return <CommingSoonPage />;

  return (
    <Pages.Page title={["Tasks", group.name]}>
      <Paper.Root size="large" fluid>
        <Paper.Body minHeight="500px" backgroundColor="bg-surface">
          <GroupPageNavigation group={group} activeTab="tasks" />

          <div className="flex justify-between mb-6">
            <div className="flex items-center gap-4">
              <Link to={`/spaces/${group.id}/tasks?status=open`}>Open</Link>
              <Link to={`/spaces/${group.id}/tasks?status=closed`}>Closed</Link>
            </div>

            <FilledButton size="xs" type="primary" onClick={() => setNewTaskModalOpen(true)}>
              New Task
            </FilledButton>
          </div>

          <TaskList />
          <NewTaskModal
            modalTitle={`Adding a new task to ${group.name}`}
            isOpen={newTaskModalOpen}
            hideModal={() => setNewTaskModalOpen(false)}
            onSubmit={refresh}
            group={group}
          />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function TaskList() {
  const { tasks } = useLoadedData();

  const columnSizes = [400, 150, 150, 150, 150, 150];
  const headers = ["Task", "Priority", "Size", "Assignees", "Due Date", "Status"];

  const rows = tasks.map((task) => {
    return [
      <div className="inline-flex font-medium">
        <Link to={`/tasks/${task.id}`}>{task.name}</Link>
      </div>,
      <div className="inline-flex justify-center">{task.priority}</div>,
      <div className="inline-flex justify-center">{task.size}</div>,
      <div className="inline-flex justify-center">{task.assignee!.fullName}</div>,
      <div className="inline-flex justify-center">
        <FormattedTime time={task.dueDate} format="short-date" />
      </div>,
      <div className="inline-flex justify-center">{task.status === "open" ? <OpenBadge /> : <ClosedBadge />}</div>,
    ];
  });

  return <Table headers={headers} rows={rows} columnSizes={columnSizes} cellPadding="px-2 py-1.5" />;
}

function CommingSoonPage() {
  const { group } = useLoadedData();

  return (
    <Pages.Page title={group.name}>
      <Paper.Root size="large">
        <Paper.Body minHeight="500px">
          <GroupPageNavigation group={group} activeTab="tasks" />
          <ComingSoonBadge />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
