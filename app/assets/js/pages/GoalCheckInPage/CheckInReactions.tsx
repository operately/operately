import * as React from "react";
import * as ReactionsModel from "@/models/reactions";

import { useLoadedData } from "./loader";
import { assertPresent } from "@/utils/assertions";
import { useIsEditMode } from "@/components/Pages";
import { Reactions } from "turboui";

export function CheckInReactions() {
  const { update } = useLoadedData();
  const isEditMode = useIsEditMode();

  const reactions = update.reactions!.map((r: any) => r!);
  const entity = ReactionsModel.entity(update.id!, "goal_update");
  const form = ReactionsModel.useReactionsForm(entity, reactions);

  assertPresent(update.permissions?.canComment, "permissions must be present in update");

  if (isEditMode) return null;

  return (
    <div className="mt-8">
      <Reactions {...form} size={24} canAddReaction={update.permissions.canComment} />
    </div>
  );
}
