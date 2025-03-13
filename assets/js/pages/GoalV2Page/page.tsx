import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import { useClearNotificationsOnLoad } from "@/features/notifications";
import { assertPresent } from "@/utils/assertions";

import { useLoadedData } from "./loader";
import { Form } from "./Form";
import { Options } from "./Options";
import { GoalFeed } from "./GoalFeed";

export function Page() {
  const { goal } = useLoadedData();

  assertPresent(goal.notifications, "Goal notifications must be defined");
  useClearNotificationsOnLoad(goal.notifications);

  return (
    <Pages.Page title={goal.name!} key={goal.id}>
      <Paper.Root size="large">
        <Paper.Body>
          <Options />
          <Form />
          <GoalFeed />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
