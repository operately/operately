import * as React from "react";
import * as Reactions from "@/models/reactions";

import { useLoadedData } from "./loader";
import { ReactionList, useReactionsForm } from "@/features/Reactions";
import { assertPresent } from "@/utils/assertions";

export function CheckInReactions() {
  const { update } = useLoadedData();
  const reactions = update.reactions!.map((r: any) => r!);
  const entity = Reactions.entity(update.id!, "goal_update");
  const addReactionForm = useReactionsForm(entity, reactions);

  assertPresent(update.goal?.permissions?.canCommentOnUpdate, "permissions must be present in update");

  return (
    <div className="mt-8">
      <ReactionList size={24} form={addReactionForm} canAddReaction={update.goal.permissions.canCommentOnUpdate} />
    </div>
  );
}
