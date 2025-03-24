import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Goals from "@/models/goals";

import { Paths } from "@/routes/paths";
import { SubscribersSelector, useSubscriptions } from "@/features/Subscriptions";
import { Spacer } from "@/components/Spacer";
import { assertPresent } from "@/utils/assertions";
import { useForm, Form as CheckInForm } from "@/features/goals/GoalCheckIn";

import Forms from "@/components/Forms";
import FormattedTime from "@/components/FormattedTime";

interface LoaderResult {
  goal: Goals.Goal;
}

export async function loader({ params }): Promise<LoaderResult> {
  return {
    goal: await Goals.getGoal({
      id: params.goalId,
      includeSpace: true,
      includeTargets: true,
      includeReviewer: true,
      includePotentialSubscribers: true,
    }).then((data) => data.goal!),
  };
}

export function Page() {
  const { goal } = Pages.useLoadedData<LoaderResult>();

  return (
    <Pages.Page title={["Check-in", goal.name!]} testId="goal-check-in-new-page">
      <Paper.Root>
        <Navigation goal={goal} />

        <Paper.Body className="p-4 md:p-8 lg:px-28 lg:py-8" noPadding>
          <Header />
          <Form goal={goal} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Header() {
  return (
    <div>
      <h1 className="text-content-accent text-xl sm:text-3xl font-extrabold text-center">
        Check-In for <FormattedTime time={new Date()} format="long-date" />
      </h1>
      <p className="text-center mt-1">Share the progress with the team</p>
    </div>
  );
}

function Navigation({ goal }: { goal: Goals.Goal }) {
  assertPresent(goal.space, "space must be present in goal");

  return (
    <Paper.Navigation
      items={[
        { to: Paths.spacePath(goal.space.id!), label: goal.space.name! },
        { to: Paths.spaceGoalsPath(goal.space.id!), label: "Goals & Projects" },
        { to: Paths.goalPath(goal.id!), label: goal.name! },
      ]}
    />
  );
}

function Form({ goal }: { goal: Goals.Goal }) {
  assertPresent(goal.space, "space must be present in goal");
  assertPresent(goal.potentialSubscribers, "potentialSubscribers must be present in goal");

  const subscriptionsState = useSubscriptions(goal.potentialSubscribers, {
    ignoreMe: true,
    notifyPrioritySubscribers: true,
  });

  const form = useForm({ mode: "create", goal, subscriptionsState });

  return (
    <CheckInForm form={form} goal={goal} readonly={false}>
      <Spacer size={4} />
      <SubscribersSelector state={subscriptionsState} spaceName={goal.space.name!} />
      <Forms.Submit saveText="Check In" buttonSize="base" />
    </CheckInForm>
  );
}
