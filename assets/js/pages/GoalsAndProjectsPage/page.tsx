import React from "react";
import { useNavigate } from "react-router-dom";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

import { GoalTree } from "@/features/goals/GoalTree";
import { OptionsButton } from "@/components/Buttons";
import { Paths } from "@/routes/paths";
import { useLoadedData } from "./loader";
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
    <Pages.Page title="Goals & Projects">
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
  const navigate = useNavigate();

  const newGoalPath = Paths.newGoalPath({ companyWide: true });
  const newProjectPath = Paths.newProjectPath();

  return (
    <div className="flex items-center justify-between mb-8">
      <h1 className="text-3xl font-bold mb-2">Goals & Projects</h1>

      <OptionsButton
        align="end"
        options={[
          { label: "Add goal", action: () => navigate(newGoalPath), testId: "add-goal" },
          { label: "Add project", action: () => navigate(newProjectPath), testId: "add-project" },
        ]}
        testId="add-options"
      />
    </div>
  );
}
