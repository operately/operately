import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Icons from "@tabler/icons-react";

import { GoalTree } from "@/features/goals/GoalTree";
import { PrimaryButton } from "@/components/Buttons";
import { Paths } from "@/routes/paths";
import { useLoadedData } from "./loader";
import classNames from "classnames";
import { MenuLinkItem } from "@/components/Menu";

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
  return (
    <div className="flex items-center justify-between mb-8">
      <h1 className="text-3xl font-bold mb-2">Goals & Projects</h1>
      <AddButton />
    </div>
  );
}

function AddButton() {
  const newGoalPath = Paths.newGoalPath({ companyWide: true });
  const newProjectPath = Paths.newProjectPath();

  const options = [
    <MenuLinkItem to={newGoalPath} testId="add-goal" icon={Icons.IconTarget}>
      Add Goal
    </MenuLinkItem>,
    <MenuLinkItem to={newProjectPath} testId="add-project" icon={Icons.IconHexagons}>
      Add Project
    </MenuLinkItem>,
  ];

  return (
    <PrimaryButton size="sm" optionsAlign="end" options={options} testId="add-options">
      Add
    </PrimaryButton>
  );
}
