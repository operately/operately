import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";

import { GroupPageNavigation } from "@/components/GroupPageNavigation";
import { useLoadedData } from "./loader";

export function Page() {
  const { group } = useLoadedData();

  return (
    <Pages.Page title={group.name}>
      <Paper.Root size="large" fluid>
        <Paper.Body minHeight="500px" backgroundColor="bg-surface">
          <GroupPageNavigation group={group} activeTab="tasks" />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
