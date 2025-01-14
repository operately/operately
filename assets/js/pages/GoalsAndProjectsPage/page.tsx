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
    <Pages.Page title="Goal Map" testId="goals-and-projects-page">
      <Paper.Root size="xlarge">
        <Paper.Body noPadding={noPadding} className={bodyClassName} minHeight="500px">
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
    <Paper.Header
      title="Goal Map"
      actions={<AddGoalOrProjectButton newGoalPath={newGoalPath} newProjectPath={newProjectPath} />}
      layout="title-center-actions-left"
      underline
    />
  );
}
