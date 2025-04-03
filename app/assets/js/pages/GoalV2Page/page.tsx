import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import { Navigation } from "@/features/goals/GoalPageNavigation";
import { useClearNotificationsOnLoad } from "@/features/notifications";
import { banner } from "@/features/goals/GoalPageHeader/Banner";
import { assertPresent } from "@/utils/assertions";

import { useLoadedData } from "./loader";
import { Form } from "./Form";
import { Options } from "./Options";
import { GoalFeed } from "./GoalFeed";

export function Page() {
  const { goal } = useLoadedData();

  assertPresent(goal.notifications, "Goal notifications must be defined");
  assertPresent(goal.space, "Goal space must be defined");

  useClearNotificationsOnLoad(goal.notifications);

  return (
    <Pages.Page title={goal.name!} key={goal.id}>
      <Paper.Root size="large">
        <Navigation space={goal.space} />

        <Paper.Body banner={banner(goal)}>
          <Options />
          <Form />
          <GoalFeed />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
