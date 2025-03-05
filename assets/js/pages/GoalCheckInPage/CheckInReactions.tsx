import * as React from "react";
import * as Reactions from "@/models/reactions";

import { useLoadedData } from "./loader";
import { ReactionList, useReactionsForm } from "@/features/Reactions";
import { assertPresent } from "@/utils/assertions";
import { useIsEditMode } from "@/components/Pages";

export function CheckInReactions() {
  const { update } = useLoadedData();
  const isEditMode = useIsEditMode();

  const reactions = update.reactions!.map((r: any) => r!);
  const entity = Reactions.entity(update.id!, "goal_update");
  const addReactionForm = useReactionsForm(entity, reactions);

  assertPresent(update.goal?.permissions?.canCommentOnUpdate, "permissions must be present in update");

  if (isEditMode) return null;

  return (
    <div className="mt-8">
      <ReactionList size={24} form={addReactionForm} canAddReaction={update.goal.permissions.canCommentOnUpdate} />
    </div>
  );
}
