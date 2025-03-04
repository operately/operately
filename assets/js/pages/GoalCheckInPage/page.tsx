import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

import { AckCTA } from "./AckCTA";

export function Page() {
  return (
    <Pages.Page title={"GoalCheckInPage"}>
      <Paper.Root>
        <Paper.Body>
          <div className="text-content-accent text-3xl font-extrabold">GoalCheckInPage</div>
          <AckCTA />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
