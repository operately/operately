import * as React from "react";

import { useLoadedData } from "./loader";
import { CommentSection, useForGoalCheckIn } from "@/features/CommentSection";
import { assertPresent } from "@/utils/assertions";

export function Comments() {
  const { update } = useLoadedData();
  const commentsForm = useForGoalCheckIn(update);

  assertPresent(update.goal?.permissions?.canCommentOnUpdate, "permissions must be present in update");

  return (
    <>
      <div className="border-t border-stroke-base mt-8" />
      <CommentSection
        form={commentsForm}
        commentParentType="goal_update"
        canComment={update.goal.permissions.canCommentOnUpdate}
      />
    </>
  );
}
