import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";

import { PageHeader } from "@/features/Profile/PageHeader";
import { PageNavigation } from "@/features/Profile/PageNavigation";
import { GoalTree } from "@/features/GoalTree";
import { useLoadedData, useTimeframeControles } from "./loader";

export function Page() {
  const { person, goals } = useLoadedData();
  const [timeframe, next, prev] = useTimeframeControles();

  return (
    <Pages.Page title={[person.fullName, "Profile"]}>
      <Paper.Root fluid>
        <PageNavigation />

        <Paper.Body>
          <PageHeader person={person} activeTab="goals" />

          <div className="mt-4" />

          <GoalTree
            goals={goals}
            timeframe={timeframe}
            nextTimeframe={next}
            prevTimeframe={prev}
            filters={{ personId: person.id }}
            hideSpaceColumn={false}
          />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
