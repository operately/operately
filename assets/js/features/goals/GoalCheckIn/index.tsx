import React from "react";

import Avatar from "@/components/Avatar";
import FormattedTime from "@/components/FormattedTime";
import RichContent from "@/components/RichContent";

import { SecondaryButton } from "@/components/Buttons";
import { Paths } from "@/routes/paths";
import { ReactionList, useReactionsForm } from "@/features/Reactions";

import * as Icons from "@tabler/icons-react";
import * as Goals from "@/models/goals";

import plurarize from "@/utils/plurarize";
import { DivLink } from "@/components/Link";

export function LastCheckInMessage({ goal }) {
  if (!goal.lastCheckIn) return null;

  const message = goal.lastCheckIn.message;
  const path = Paths.goalProgressUpdatePath(goal.lastCheckIn.id);
  const author = goal.lastCheckIn.author;
  const championProfilePath = Paths.profilePath(author.id!);

  return (
    <div className="flex items-start gap-4">
      <DivLink to={championProfilePath}>
        <Avatar person={author} size={40} />
      </DivLink>
      <div className="flex flex-col gap-1 -mt-1">
        <div className="font-semibold">
          Last progress update from <FormattedTime time={goal.lastCheckIn.insertedAt} format="short-date" />
        </div>

        <div className="flex flex-col gap-3 w-full">
          <RichContent jsonContent={message} />

          <div className="flex items-center gap-3">
            <LastMessageReactions goal={goal} />
            <SecondaryButton linkTo={path} size="xs">
              Discuss
            </SecondaryButton>
            <LastMessageComments goal={goal} />
          </div>
        </div>
      </div>
    </div>
  );
}

function LastMessageComments({ goal }: { goal: Goals.Goal }) {
  if (!goal.lastCheckIn) return null;

  const path = Paths.goalProgressUpdatePath(goal.lastCheckIn!.id!);

  return (
    <div className="flex items-center gap-1 text-sm leading-none text-content-dimmed">
      <Icons.IconMessage size={14} />{" "}
      <DivLink to={path} className="hover:underline cursor-pointer">
        {plurarize(goal.lastCheckIn!.commentsCount!, "comment", "comments")}
      </DivLink>
    </div>
  );
}

function LastMessageReactions({ goal }: { goal: Goals.Goal }) {
  const update = goal.lastCheckIn!;
  const reactions = update.reactions!.map((r: any) => r!);
  const entity = { id: update.id!, type: "update" };

  const addReactionForm = useReactionsForm(entity, reactions);

  return <ReactionList size={20} form={addReactionForm} />;
}
