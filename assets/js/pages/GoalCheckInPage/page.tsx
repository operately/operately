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
import { banner } from "@/features/goals/GoalPageHeader/Banner";

export function Page() {
  const title = useGoalCheckInPageTitle();
  useClearGoalCheckInNotifications();

  return (
    <Pages.Page title={title} testId="goal-check-in-page">
      <Paper.Root>
        <Navigation />
        <Body />
      </Paper.Root>
    </Pages.Page>
  );
}

function Body() {
  const mode = Pages.usePageMode();
  const { goal } = Pages.useLoadedData();

  return (
    <Paper.Body className="p-4 md:p-8 lg:px-28 lg:pt-8" noPadding banner={banner(goal)}>
      <Options />
      <Header />
      <Form />

      {mode === "view" && (
        <>
          <AckCTA />
          <CheckInReactions />
          <Comments />
          <Subscriptions />
        </>
      )}
    </Paper.Body>
  );
}
