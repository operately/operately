import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as Icons from "@tabler/icons-react";
import * as PageOptions from "@/components/PaperContainer/PageOptions";

import { useLoadedData, useRefresh } from "./loader";
import FormattedTime from "@/components/FormattedTime";
import { ReactionList, useReactionsForm } from "@/features/Reactions";
import { createPath } from "@/utils/paths";

import { TextSeparator } from "@/components/TextSeparator";
import { Spacer } from "@/components/Spacer";
import { AckCTA } from "./AckCTA";

import Avatar from "@/components/Avatar";
import RichContent from "@/components/RichContent";
import { CommentSection, useForGoalCheckIn } from "@/features/CommentSection";

export function Page() {
  const { goal, update, me } = useLoadedData();
  const refresh = useRefresh();

  const commentsForm = useForGoalCheckIn(update);

  return (
    <Pages.Page title={["Check-In", goal.name]}>
      <Paper.Root>
        <Navigation goal={goal} />

        <Paper.Body>
          {me.id === update.author?.id && <Options />}

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
          <RichContent jsonContent={update.message} className="text-lg" />
          <Spacer size={4} />

          <Spacer size={4} />
          <Reactions />

          <AckCTA />
          <Spacer size={4} />
          <CommentSection form={commentsForm} me={me} refresh={refresh} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Reactions() {
  const { update, me } = useLoadedData();
  const reactions = update.reactions!.map((r) => r!);
  const entity = { id: update.id, type: "goal_check_in" };
  const addReactionForm = useReactionsForm(entity, reactions, me);

  return <ReactionList size={24} form={addReactionForm} />;
}

function Acknowledgement({ update }: { update: Updates.Update }) {
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
      Check-In from <FormattedTime time={update.insertedAt} format="long-date" />
    </div>
  );
}

function Navigation({ goal }) {
  const goalPath = createPath("goals", goal.id);
  const goalCheckInsPath = createPath("goals", goal.id, "check-ins");

  return (
    <Paper.Navigation>
      <Paper.NavItem linkTo={goalPath}>{goal.name}</Paper.NavItem>
      <Paper.NavSeparator />
      <Paper.NavItem linkTo={goalCheckInsPath}>Check-Ins</Paper.NavItem>
    </Paper.Navigation>
  );
}

function Options() {
  const { goal, update } = useLoadedData();

  return (
    <PageOptions.Root position="top-right" testId="options-button">
      <PageOptions.Link
        icon={Icons.IconEdit}
        title="Edit check-in"
        to={`/goals/${goal.id}/check-ins/${update.id}/edit`}
        dataTestId="edit-check-in"
      />
    </PageOptions.Root>
  );
}
