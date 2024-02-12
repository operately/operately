import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";

import { Table } from "./Table";
import { GroupPageNavigation } from "@/components/GroupPageNavigation";
import { useLoadedData } from "./loader";

export function Page() {
  const { group } = useLoadedData();

  return (
    <Pages.Page title={group.name}>
      <Paper.Root size="large" fluid>
        <Paper.Body minHeight="500px" backgroundColor="bg-surface">
          <GroupPageNavigation group={group} activeTab="tasks" />

          <TaskList />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function TaskList() {
  const columnSizes = [400, 150, 150, 150, 150, 150];
  const headers = ["Task", "Priority", "Size", "Assignees", "Due Date", "Status"];

  const rows = [
    [
      <div className="inline-flex justify-center font-medium">Renew SSL certificate for the staging environment</div>,
      <div className="inline-flex justify-center">High</div>,
      <div className="inline-flex justify-center">Small</div>,
      <div className="inline-flex justify-center">John Doe</div>,
      <div className="inline-flex justify-center">Feb 15th</div>,
      <div className="inline-flex justify-center">Open</div>,
    ],
  ];

  return <Table headers={headers} rows={rows} columnSizes={columnSizes} cellPadding="px-2 py-1.5" />;
}
