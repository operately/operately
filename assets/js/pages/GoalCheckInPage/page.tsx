import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

import { useClearGoalCheckInNotifications } from "./useClearGoalCheckInNotifications";
import { useGoalCheckInPageTitle } from "./useGoalCheckInPageTitle";

import { Navigation } from "./Navigation";
import { Options } from "./Options";
import { Header } from "./Header";
import { AckCTA } from "./AckCTA";
import { Comments } from "./Comments";
import { Form } from "./Form";
import { CheckInReactions } from "./CheckInReactions";
import { Subscriptions } from "./Subscriptions";

export function Page() {
  const title = useGoalCheckInPageTitle();
  useClearGoalCheckInNotifications();

  return (
    <Pages.Page title={title} testId="goal-check-in-page">
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
