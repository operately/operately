import * as React from "react";
import { useOptimisticReactions } from "@/models/reactions/useOptimisticReactions";

import { useLoadedData, useRefresh } from "./loader";
import { assertPresent } from "@/utils/assertions";
import { useIsEditMode } from "@/components/Pages";
import { Reactions } from "turboui";

export function CheckInReactions() {
  const { update } = useLoadedData();
  const refresh = useRefresh();
  const isEditMode = useIsEditMode();

  const form = useOptimisticReactions({
    entity: { id: update.id, type: "goal_update" },
    initialReactions: update.reactions ?? undefined,
    onRefresh: refresh,
  });

  assertPresent(update.permissions?.canComment, "permissions must be present in update");

  if (isEditMode) return null;

  return (
    <div className="mt-8">
      <Reactions {...form} size={24} canAddReaction={update.permissions.canComment} />
    </div>
  );
}
