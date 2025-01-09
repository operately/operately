import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as Icons from "@tabler/icons-react";
import * as PageOptions from "@/components/PaperContainer/PageOptions";
import * as Reactions from "@/models/reactions";

import { useLoadedData, useRefresh } from "./loader";
import FormattedTime from "@/components/FormattedTime";
import { ReactionList, useReactionsForm } from "@/features/Reactions";

import { TextSeparator } from "@/components/TextSeparator";
import { Spacer } from "@/components/Spacer";
import { AckCTA } from "./AckCTA";

import { CurrentSubscriptions } from "@/features/Subscriptions";
import Avatar from "@/components/Avatar";
import { CommentSection, useForGoalCheckIn } from "@/features/CommentSection";
import { Paths, compareIds } from "@/routes/paths";
import { useMe } from "@/contexts/CurrentCompanyContext";
import { assertPresent } from "@/utils/assertions";
import { useClearNotificationsOnLoad } from "@/features/notifications";
import { DescriptionSection, StatusSection, TargetsSection } from "@/features/goals/GoalCheckIn";

export function Page() {
  const me = useMe()!;
  const refresh = useRefresh();

  const { update } = useLoadedData();

  assertPresent(update.notifications, "Update notifications must be defined");
  assertPresent(update.goal?.reviewer, "goal and reviewer must be present in update");
  useClearNotificationsOnLoad(update.notifications);

  return (
    <Pages.Page title={["Goal Progress Update", update.goal!.name!]}>
      <Paper.Root>
        <Navigation goal={update.goal!} />

        <Paper.Body>
          {compareIds(me.id, update.author?.id) && <Options />}

          <div className="flex flex-col items-center">
            <Title update={update} />
            <div className="flex gap-0.5 flex-row items-center mt-1 text-content-accent font-medium">
              <div className="flex items-center gap-2">
                <Avatar person={update.author!} size="tiny" /> {update.author?.fullName}
              </div>
              <TextSeparator />
              <Acknowledgement update={update} />
            </div>
          </div>

          <Spacer size={4} />

          <StatusSection update={update} reviewer={update.goal.reviewer} />
          <DescriptionSection update={update} />
          <TargetsSection update={update} />

          <Spacer size={4} />
          <GoalUpdateReactions />

          <AckCTA />
          <Comments />

          <div className="border-t border-stroke-base mt-16 mb-8" />

          <CurrentSubscriptions
            subscriptionList={update.subscriptionList!}
            potentialSubscribers={update.potentialSubscribers!}
            name="update"
            type="goal_update"
            callback={refresh}
          />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function GoalUpdateReactions() {
  const { update } = useLoadedData();
  const reactions = update.reactions!.map((r: any) => r!);
  const entity = Reactions.entity(update.id!, "goal_update");
  const addReactionForm = useReactionsForm(entity, reactions);

  assertPresent(update.goal?.permissions?.canCommentOnUpdate, "permissions must be present in update");

  return <ReactionList size={24} form={addReactionForm} canAddReaction={update.goal.permissions.canCommentOnUpdate} />;
}

function Comments() {
  const refresh = useRefresh();
  const { update } = useLoadedData();
  const commentsForm = useForGoalCheckIn(update);

  assertPresent(update.goal?.permissions?.canCommentOnUpdate, "permissions must be present in update");

  return (
    <>
      <div className="border-t border-stroke-base mt-8" />
      <CommentSection
        form={commentsForm}
        refresh={refresh}
        commentParentType="goal_update"
        canComment={update.goal.permissions.canCommentOnUpdate}
      />
    </>
  );
}

function Acknowledgement({ update }) {
  if (update.acknowledgedAt) {
    return (
      <span className="flex items-center gap-1">
        <Icons.IconSquareCheckFilled size={16} className="text-accent-1" />
        Acknowledged by {update.acknowledgingPerson.fullName}
      </span>
    );
  } else {
    return <span className="flex items-center gap-1">Not yet acknowledged</span>;
  }
}

function Title({ update }) {
  return (
    <div className="text-content-accent text-2xl font-extrabold">
      Progress Update from <FormattedTime time={update.insertedAt} format="long-date" />
    </div>
  );
}

function Navigation({ goal }) {
  const goalPath = Paths.goalPath(goal.id!);

  return (
    <Paper.Navigation>
      <Paper.NavItem linkTo={goalPath}>{goal.name}</Paper.NavItem>
    </Paper.Navigation>
  );
}

function Options() {
  const { update } = useLoadedData();

  return (
    <PageOptions.Root testId="options-button">
      <PageOptions.Link
        icon={Icons.IconEdit}
        title="Edit Update"
        to={Paths.goalEditProgressUpdatePath(update.id!)}
        testId="edit-update"
      />
    </PageOptions.Root>
  );
}
