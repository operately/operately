import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

import { Navigation } from "./Navigation";
import { Options } from "./Options";
import { Header } from "./Header";
import { AckCTA } from "./AckCTA";
import { Comments } from "./Comments";
import { CheckInReactions } from "./CheckInReactions";
import { Form } from "./Form";

export function Page() {
  return (
    <Pages.Page title={"GoalCheckInPage"}>
      <Paper.Root>
        <Navigation />

        <Paper.Body>
          <Options />
          <Header />
          <Form />
          <AckCTA />
          <CheckInReactions />
          <Comments />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
