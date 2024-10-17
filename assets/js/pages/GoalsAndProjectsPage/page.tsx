import React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

import { GoalTree } from "@/features/goals/GoalTree/tree-v2";
import { useLoadedData } from "./loader";

export function Page() {
  const { goals, projects } = useLoadedData();

  return (
    <Pages.Page title="Goals & Projects">
      <Paper.Root size="xlarge">
        <Paper.Body>
          <Title />
          <GoalTree goals={goals} projects={projects} options={{}} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Title() {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold">Goals & Projects</h1>
    </div>
  );
}
