import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

import { Navigation } from "./Navigation";
import { Options } from "./Options";
import { Header } from "./Header";
import { AckCTA } from "./AckCTA";

export function Page() {
  return (
    <Pages.Page title={"GoalCheckInPage"}>
      <Paper.Root>
        <Navigation />

        <Paper.Body>
          <Options />
          <Header />
          <AckCTA />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
