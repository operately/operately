import * as React from "react";
import { type QueryClient } from "@tanstack/react-query";
import { CommentSection } from "turboui";
import { useCommentSection } from "@/features/CommentSection/useCommentSection";
import { invalidateGoalInteractionQueries } from "@/models/goals/goalLifecycle";
import { useLoadedData } from "./loader";
import { assertPresent } from "@/utils/assertions";
import { useIsEditMode } from "@/components/Pages";

export function Comments() {
  const { update, goal } = useLoadedData();
  const isEditMode = useIsEditMode();

  assertPresent(update.permissions?.canComment, "permissions must be present in update");

  const context = { goalId: goal.id, resourceId: update.id, resourceType: "goal_update" as const };

  function invalidateQueries(client: QueryClient, refetchType: "active" | "none") {
    return invalidateGoalInteractionQueries(client, context, refetchType);
  }

  const props = useCommentSection({
    entity: { id: update.id, type: "goal_update" },
    mentionSearchScope: { type: "goal", id: goal.id },
    invalidateQueries,
    canComment: update.permissions.canComment,
    acknowledgedAt: update.acknowledged ? update.acknowledgedAt : null,
    acknowledgedBy: update.acknowledgingPerson,
  });

  if (isEditMode || !props) return null;

  return (
    <>
      <div className="border-t border-stroke-base mt-8" />
      <CommentSection {...props} />
    </>
  );
}
