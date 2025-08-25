import React, { useMemo } from "react";
import { TimelineItem } from "./TimelineItem";
import { CommentInput } from "../CommentSection/CommentInput";
import { TimelineProps } from "./types";

export function Timeline({
  items,
  currentUser,
  canComment,
  commentParentType,
  onAddComment,
  onEditComment,
  mentionedPersonLookup,
  peopleSearch,
  filters,
}: TimelineProps) {
  const filteredItems = useMemo(() => {
    if (!filters) return items;

    return items.filter((item) => {
      // Filter by type
      if (!filters.showComments && item.type === "comment") return false;
      if (
        !filters.showActivities &&
        (item.type === "task-activity" || item.type === "milestone-activity" || item.type === "acknowledgment")
      )
        return false;

      // Filter by author
      if (filters.authorFilter && filters.authorFilter.length > 0) {
        const authorId = getItemAuthorId(item);
        if (authorId && !filters.authorFilter.includes(authorId)) return false;
      }

      // Filter by date range
      if (filters.dateRange) {
        const itemDate = getItemDate(item);
        if (itemDate) {
          const itemTime = new Date(itemDate).getTime();
          const startTime = new Date(filters.dateRange.start).getTime();
          const endTime = new Date(filters.dateRange.end).getTime();
          if (itemTime < startTime || itemTime > endTime) return false;
        }
      }

      return true;
    });
  }, [items, filters]);

  const mockForm = useMemo(
    () => ({
      items: [],
      submitting: false,
      postComment: onAddComment || (() => {}),
      editComment: onEditComment || (() => {}),
    }),
    [onAddComment, onEditComment],
  );

  return (
    <div className="flex flex-col">
      {filteredItems.length === 0 ? (
        <EmptyTimeline />
      ) : (
        filteredItems.map((item, index) => (
          <TimelineItem
            key={getItemKey(item, index)}
            item={item}
            currentUser={currentUser}
            canComment={canComment}
            commentParentType={commentParentType}
            onEditComment={onEditComment}
            mentionedPersonLookup={mentionedPersonLookup}
            peopleSearch={peopleSearch}
          />
        ))
      )}

      {canComment && (
        <CommentInput
          form={mockForm}
          currentUser={currentUser}
          mentionedPersonLookup={mentionedPersonLookup}
          peopleSearch={peopleSearch}
        />
      )}
    </div>
  );
}

function EmptyTimeline() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="text-content-dimmed text-lg mb-2">No activity yet</div>
      <div className="text-content-dimmed text-sm">Comments and task updates will appear here</div>
    </div>
  );
}

function getItemAuthorId(item: any): string | null {
  switch (item.type) {
    case "comment":
      return item.value.author?.id || null;
    case "task-activity":
    case "milestone-activity":
      return item.value.author?.id || null;
    case "acknowledgment":
      return item.value.id || null;
    default:
      return null;
  }
}

function getItemDate(item: any): string | null {
  switch (item.type) {
    case "comment":
      return item.value.insertedAt || null;
    case "task-activity":
    case "milestone-activity":
      return item.value.insertedAt || null;
    case "acknowledgment":
      return item.insertedAt || null;
    default:
      return null;
  }
}

function getItemKey(item: any, index: number): string {
  const id = item.value?.id || item.value?.id || index;
  return `${item.type}-${id}`;
}
