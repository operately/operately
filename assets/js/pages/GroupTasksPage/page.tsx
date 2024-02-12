import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";

import { GroupPageNavigation } from "@/components/GroupPageNavigation";
import { FilledButton } from "@/components/Button";

import { useLoadedData } from "./loader";
import { NewTaskModal } from "./NewTaskModal";
import { Table } from "./Table";
import FormattedTime from "@/components/FormattedTime";

export function Page() {
  const { group } = useLoadedData();

  const [newTaskModalOpen, setNewTaskModalOpen] = React.useState(true);

  return (
    <Pages.Page title={group.name}>
      <Paper.Root size="large" fluid>
        <Paper.Body minHeight="500px" backgroundColor="bg-surface">
          <GroupPageNavigation group={group} activeTab="tasks" />

          <div className="flex justify-end mb-6">
            <FilledButton size="xs" type="primary" onClick={() => setNewTaskModalOpen(true)}>
              New Task
            </FilledButton>
          </div>

          <TaskList />
          <NewTaskModal
            modalTitle={`Adding a new task to ${group.name}`}
            isOpen={newTaskModalOpen}
            hideModal={() => setNewTaskModalOpen(false)}
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
      <div className="inline-flex justify-center font-medium">{task.name}</div>,
      <div className="inline-flex justify-center">{task.priority}</div>,
      <div className="inline-flex justify-center">{task.size}</div>,
      <div className="inline-flex justify-center">{task.assignee!.fullName}</div>,
      <div className="inline-flex justify-center">
        <FormattedTime time={task.dueDate} format="short-date" />
      </div>,
      <div className="inline-flex justify-center">Open</div>,
    ];
  });

  return <Table headers={headers} rows={rows} columnSizes={columnSizes} cellPadding="px-2 py-1.5" />;
}
