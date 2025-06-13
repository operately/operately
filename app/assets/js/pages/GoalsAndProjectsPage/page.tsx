import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

import { AddGoalOrProjectButton } from "@/features/goals/AddGoalOrProjectButton";
import { GoalTree } from "@/features/goals/GoalTree";
import { DeprecatedPaths } from "@/routes/paths";
import { useLoadedData } from "./loader";

import classNames from "classnames";

export function Page() {
  const { goals, projects } = useLoadedData();
  const size = Pages.useWindowSizeBreakpoints();

  const bodyClassName = classNames({
    "p-6": size === "sm",
    "p-4": size === "xs",
  });

  return (
    <Pages.Page title="Goal Map" testId="goals-and-projects-page">
      <Paper.Root size="large">
        <Paper.Body className={bodyClassName} minHeight="500px">
          <Header />
          <GoalTree goals={goals} projects={projects} options={{}} settingsNamespace="global" />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Header() {
  const newGoalPath = DeprecatedPaths.newGoalPath({ companyWide: true });
  const newProjectPath = DeprecatedPaths.newProjectPath({
    backPath: DeprecatedPaths.goalsPath(),
    backPathName: "Back to Goal Map",
  });

  return (
    <Paper.Header
      title="Goal Map"
      actions={<AddGoalOrProjectButton newGoalPath={newGoalPath} newProjectPath={newProjectPath} />}
      layout="title-center-actions-left"
      underline
    />
  );
}
