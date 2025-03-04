import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

import { AckCTA } from "./AckCTA";
import { GoalSubpageNavigation } from "@/features/goals/GoalSubpageNavigation";
import { useLoadedData } from "./loader";

export function Page() {
  const { goal } = useLoadedData();

  return (
    <Pages.Page title={"GoalCheckInPage"}>
      <Paper.Root>
        <GoalSubpageNavigation goal={goal} />

        <Paper.Body>
          <div className="text-content-accent text-3xl font-extrabold">GoalCheckInPage</div>
          <AckCTA />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
