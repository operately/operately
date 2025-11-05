import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Goals from "@/models/goals";
import * as React from "react";

import { Form as CheckInForm, useForm } from "@/features/goals/GoalCheckIn";
import { banner } from "@/features/goals/GoalPageHeader/Banner";
import { useSubscriptionsAdapter } from "@/models/subscriptions";
import { PageModule } from "@/routes/types";
import { assertPresent } from "@/utils/assertions";

import FormattedTime from "@/components/FormattedTime";

import { usePaths } from "@/routes/paths";
export default { name: "GoalCheckInNewPage", loader, Page } as PageModule;

interface LoaderResult {
  goal: Goals.Goal;
}

async function loader({ params }): Promise<LoaderResult> {
  return {
    goal: await Goals.getGoal({
      id: params.goalId,
      includeSpace: true,
      includeReviewer: true,
      includePotentialSubscribers: true,
      includeChecklist: true,
    }).then((data) => data.goal!),
  };
}

function Page() {
  const { goal } = Pages.useLoadedData<LoaderResult>();

  return (
    <Pages.Page title={["Check-in", goal.name!]} testId="goal-check-in-new-page">
      <Paper.Root>
        <Navigation goal={goal} />

        <Paper.Body className="p-4 md:p-8 lg:px-28 lg:py-8" noPadding banner={banner(goal)}>
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
  const paths = usePaths();
  assertPresent(goal.space, "space must be present in goal");

  return (
    <Paper.Navigation
      items={[
        { to: paths.spacePath(goal.space.id!), label: goal.space.name! },
        { to: paths.spaceWorkMapPath(goal.space.id!), label: "Work Map" },
        { to: paths.goalPath(goal.id!), label: goal.name! },
      ]}
    />
  );
}

function Form({ goal }: { goal: Goals.Goal }) {
  assertPresent(goal.space, "space must be present in goal");
  assertPresent(goal.potentialSubscribers, "potentialSubscribers must be present in goal");

  const subscriptionsState = useSubscriptionsAdapter(goal.potentialSubscribers, {
    ignoreMe: true,
    notifyPrioritySubscribers: true,
    spaceName: goal.space.name,
  });

  const form = useForm({ mode: "new", goal, subscriptionsState });

  return <CheckInForm form={form} goal={goal} mode="new" allowFullEdit subscriptionsState={subscriptionsState} />;
}
