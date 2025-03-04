import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as GoalCheckIns from "@/models/goalCheckIns";
import * as PageOptions from "@/components/PaperContainer/PageOptions";

import FormattedTime from "@/components/FormattedTime";
import { assertPresent } from "@/utils/assertions";
// import { Form } from "./Form";
import { IconEdit } from "@tabler/icons-react";

interface LoaderResult {
  update: GoalCheckIns.Update;
}

export async function loader({ params }): Promise<LoaderResult> {
  const updatePromise = GoalCheckIns.getGoalProgressUpdate({
    id: params.id,
    includeGoal: true,
    includeGoalSpace: true,
    includeReviewer: true,
    includeGoalTargets: true,
    includePermissions: true,
  }).then((data) => data.update!);

  return {
    update: await updatePromise,
  };
}

export function Page() {
  const { update } = Pages.useLoadedData<LoaderResult>();

  assertPresent(update.goal, "goal must be present in update");
  // Pages.us:w


  return (
    <Pages.Page title={["Goal Progress Update", update.goal.name!]}>
      <Paper.Root>
        <Navigation />

        <Paper.Body>
          <Options />
          <Title />
          {/* <Form update={update} /> */}
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Navigation() {
  const { update } = Pages.useLoadedData<LoaderResult>();

  assertPresent(update.goal?.space, "goal.space must be present in update");

  return (
    <Paper.Navigation>
      <Paper.NavSpaceLink space={update.goal.space} />
      <Paper.NavSeparator />
      <Paper.NavSpaceWorkMapLink space={update.goal.space} />
      <Paper.NavSeparator />
      <Paper.NavGoalLink goal={update.goal} />
    </Paper.Navigation>
  );
}

function Title() {
  const { update } = Pages.useLoadedData<LoaderResult>();

  return (
    <div className="text-content-accent text-2xl font-extrabold">
      Progress Update from <FormattedTime time={update.insertedAt!} format="long-date" />
    </div>
  );
}

function Options() {
  const { update } = Pages.useLoadedData<LoaderResult>();

  assertPresent(update.goal?.permissions, "goal.permissions must be present in update");

  const handleEdit = () => {};

  return (
    <PageOptions.Root testId="options-button">
      {update.goal?.permissions?.canEdit && (
        <PageOptions.Action
          icon={IconEdit}
          title="Edit"
          onClick={handleEdit}
          testId="edit-check-in"
          keepOutsideOnBigScreen
        />
      )}
    </PageOptions.Root>
  );
}
