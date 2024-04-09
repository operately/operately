import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";

import { PageHeader } from "@/features/Profile/PageHeader";
import { PageNavigation } from "@/features/Profile/PageNavigation";
import { GoalTree } from "@/features/goals/GoalTree";
import { useLoadedData } from "./loader";

export function Page() {
  const { person, goals, projects } = useLoadedData();

  return (
    <Pages.Page title={[person.fullName, "Profile"]}>
      <Paper.Root fluid>
        <PageNavigation />

        <Paper.Body>
          <PageHeader person={person} activeTab="goals" />

          <div className="mt-4" />

          <GoalTree goals={goals} projects={projects} options={{ personId: person.id }} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
