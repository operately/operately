import * as React from "react";

import * as Goals from "@/models/goals";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

import { assertPresent } from "@/utils/assertions";
import { Form } from "./Form";

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
    <Pages.Page title={["Check-In", goal.name!]}>
      <Paper.Root size="large">
        <Navigation />

        <Paper.Body className="lg:px-40">
          <Header />
          <Form goal={goal} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Header() {
  return (
    <div className="flex flex-col items-center mb-2">
      <div className="text-3xl font-extrabold">Goal Check-in</div>
      <div>Share the progress with the team</div>
    </div>
  );
}

function Navigation() {
  const { goal } = Pages.useLoadedData<LoaderResult>();

  assertPresent(goal.space, "space must be present in goal");

  return (
    <Paper.Navigation>
      <Paper.NavSpaceLink space={goal.space} />
      <Paper.NavSeparator />
      <Paper.NavSpaceWorkMapLink space={goal.space} />
      <Paper.NavSeparator />
      <Paper.NavGoalLink goal={goal} />
    </Paper.Navigation>
  );
}
