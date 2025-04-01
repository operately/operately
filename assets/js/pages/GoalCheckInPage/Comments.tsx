import * as React from "react";

import { useLoadedData } from "./loader";
import { CommentSection, useForGoalCheckIn } from "@/features/CommentSection";
import { assertPresent } from "@/utils/assertions";
import { useIsEditMode } from "@/components/Pages";

export function Comments() {
  const { update } = useLoadedData();
  const isEditMode = useIsEditMode();
  const commentsForm = useForGoalCheckIn(update);

  assertPresent(update.permissions?.canComment, "permissions must be present in update");

  if (isEditMode) return null;

  return (
    <>
      <div className="border-t border-stroke-base mt-8" />
      <CommentSection
        form={commentsForm}
        commentParentType="goal_update"
        canComment={update.permissions.canComment}
      />
    </>
  );
}
