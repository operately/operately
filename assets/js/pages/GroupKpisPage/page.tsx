import React from "react";

import { GroupPageNavigation } from "@/components/GroupPageNavigation";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import { useLoadedData } from "./loader";
import { ComingSoonBadge } from "@/components/ComingSoonBadge";

export function Page() {
  const { group } = useLoadedData();

  return (
    <Pages.Page title={group.name}>
      <Paper.Root size="large">
        <Paper.Body minHeight="500px">
          <GroupPageNavigation groupId={group.id} groupName={group.name} activeTab="kpis" />
          <ComingSoonBadge />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
