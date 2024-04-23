import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";

import { Navigation } from "@/features/goals/GoalPageNavigation";
import { Header } from "@/features/goals/GoalPageHeader";

import { useLoadedData } from "./loader";

export function Page() {
  const { goal } = useLoadedData();

  return (
    <Pages.Page title={[goal.name]}>
      <Paper.Root size="large">
        <Navigation space={goal.space} />

        <Paper.Body minHeight="none">
          <Header goal={goal} activeTab="status" />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
