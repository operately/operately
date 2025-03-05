import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

import { useClearGoalCheckInNotifications } from "./useClearGoalCheckInNotifications";

import { Navigation } from "./Navigation";
import { Options } from "./Options";
import { Header } from "./Header";
import { AckCTA } from "./AckCTA";
import { Comments } from "./Comments";
import { Form } from "./Form";
import { CheckInReactions } from "./CheckInReactions";
import { Subscriptions } from "./Subscriptions";

export function Page() {
  useClearGoalCheckInNotifications();

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
          <Subscriptions />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
