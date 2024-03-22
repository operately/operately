import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Icons from "@tabler/icons-react";
import * as Paper from "@/components/PaperContainer";

import { useLoadedData, useTimeframeControles } from "./loader";
import { FilledButton } from "@/components/Button";
import { GoalTree } from "@/features/GoalTree";

export function Page() {
  const { company, goals } = useLoadedData();

  return (
    <Pages.Page title={"Goals"}>
      <Paper.Root fluid>
        <Paper.Body className="max-w-screen-xl mx-auto">
          <div className="flex gap-4 -mb-8">
            <FilledButton linkTo={"/goals/new"}>Add Goal</FilledButton>
          </div>

          <TimeframeSelector />
          <h1 className="text-3xl font-bold text-center mt-2 mb-16">Goals in {company.name}</h1>

          <GoalTree goals={goals} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function TimeframeSelector() {
  const [timeframe, next, prev] = useTimeframeControles();

  return (
    <div className="flex items-center justify-center gap-4">
      <Icons.IconChevronLeft onClick={prev} className="cursor-pointer" />
      <span className="font-medium text-content-accent leading-loose">{timeframe}</span>
      <Icons.IconChevronRight onClick={next} className="cursor-pointer" />
    </div>
  );
}
