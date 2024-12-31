import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

import { GoalTree } from "@/features/goals/GoalTree";
import { Paths } from "@/routes/paths";
import { useLoadedData } from "./loader";
import { AddGoalOrProjectButton } from "@/features/goals/AddGoalOrProjectButton";

import classNames from "classnames";

export function Page() {
  const { goals, projects } = useLoadedData();
  const size = Pages.useWindowSizeBreakpoints();

  const noPadding = ["xs", "sm"].includes(size);
  const bodyClassName = classNames({
    "p-6": size === "sm",
    "p-4": size === "xs",
  });

  return (
    <Pages.Page title="Goals & Projects" testId="goals-and-projects-page">
      <Paper.Root size="xlarge">
        <Paper.Body noPadding={noPadding} className={bodyClassName}>
          <Header />
          <GoalTree goals={goals} projects={projects} options={{}} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Header() {
  const newGoalPath = Paths.newGoalPath({ companyWide: true });
  const newProjectPath = Paths.newProjectPath();

  return (
    <div className="flex items-center justify-between mb-8">
      <h1 className="text-3xl font-bold mb-2">Goals & Projects</h1>
      <AddGoalOrProjectButton newGoalPath={newGoalPath} newProjectPath={newProjectPath} />
    </div>
  );
}
