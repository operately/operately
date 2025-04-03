import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import { Navigation } from "@/features/goals/GoalPageNavigation";
import { useClearNotificationsOnLoad } from "@/features/notifications";
import { banner } from "@/features/goals/GoalPageHeader/Banner";
import { assertPresent } from "@/utils/assertions";
import { useBoolState } from "@/hooks/useBoolState";

import { useLoadedData } from "./loader";
import { Form } from "./Form";
import { Options } from "./Options";
import { GoalFeed } from "./GoalFeed";
import { DeleteGoalModal } from "./DeleteGoalModal";

export function Page() {
  const { goal } = useLoadedData();
  const { showDeleteGoal, toggleShowDeleteGoal } = useToggleDeleteGoal();

  assertPresent(goal.notifications, "Goal notifications must be defined");
  assertPresent(goal.space, "Goal space must be defined");

  useClearNotificationsOnLoad(goal.notifications);

  return (
    <Pages.Page title={goal.name!} key={goal.id}>
      <Paper.Root size="large">
        <Navigation space={goal.space} />

        <Paper.Body banner={banner(goal)}>
          <Options toggleShowDeleteGoal={toggleShowDeleteGoal} />
          <Form />
          <GoalFeed />
          <DeleteGoalModal showDeleteGoal={showDeleteGoal} toggleShowDeleteGoal={toggleShowDeleteGoal} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function useToggleDeleteGoal() {
  const { goal } = useLoadedData();
  const [showDeleteGoal, toggleShowDeleteGoal, _, setFalse] = useBoolState(false);

  React.useEffect(() => {
    setFalse();
  }, [goal.id]);

  return { showDeleteGoal, toggleShowDeleteGoal };
}
