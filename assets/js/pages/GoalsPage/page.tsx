import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Icons from "@tabler/icons-react";

import { useLoadedData } from "./loader";
import { FilledButton } from "@/components/Button";
import { GoalTree } from "@/features/goals/GoalTree";

export function Page() {
  const { company, goals, projects } = useLoadedData();

  return (
    <Pages.Page title={"Goals"}>
      <Paper.Root fluid>
        <Paper.Body className="max-w-screen-2xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Goals in {company.name}</h1>
            <FilledButton size="sm" linkTo={"/goals/new?company-wide=true"} testId="add-company-wide-goal">
              <Icons.IconPlus className="mr-2 inline-block" size={16} />
              Add Company-Wide Goal
            </FilledButton>
          </div>

          <GoalTree goals={goals} projects={projects} options={{}} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
