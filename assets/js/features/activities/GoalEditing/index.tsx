import * as React from "react";
import * as People from "@/models/people";
import * as Timeframes from "@/utils/timeframes";

import type { Activity } from "@/models/activities";
import type { ActivityContentGoalEditing } from "@/api";
import type { ActivityHandler } from "../interfaces";

import { GoalLink } from "./../feedItemLinks";

const GoalEditing: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(_activity: Activity): string {
    throw new Error("Not implemented");
  },

  PageTitle(_props: { activity: any }) {
    throw new Error("Not implemented");
  },

  PageContent(_props: { activity: Activity }) {
    throw new Error("Not implemented");
  },

  PageOptions(_props: { activity: Activity }) {
    return null;
  },

  FeedItemTitle({ activity, page }: { activity: Activity; page: any }) {
    return (
      <>
        {People.shortName(activity.author!)} edited <GoalLink goal={content(activity).goal!} page={page} />
      </>
    );
  },

  FeedItemContent({ activity }: { activity: Activity }) {
    const c = content(activity);
    return (
      <div className="flex-flex-col gap-1">
        <NewName content={c} />
        <Timeframe content={c} />
        <Champion content={c} />
        <Reviewer content={c} />
        <AddedTargets content={c} />
        <UpdatedTargets content={c} />
        <DeletedTargets content={c} />
      </div>
    );
  },

  commentCount(_activity: Activity): number {
    throw new Error("Not implemented");
  },

  hasComments(_activity: Activity): boolean {
    throw new Error("Not implemented");
  },

  NotificationTitle(_props: { activity: Activity }) {
    throw new Error("Not implemented");
  },

  CommentNotificationTitle(_props: { activity: Activity }) {
    throw new Error("Not implemented");
  },
};

function content(activity: Activity): ActivityContentGoalEditing {
  return activity.content as ActivityContentGoalEditing;
}

export default GoalEditing;

function NewName({ content }: { content: ActivityContentGoalEditing }) {
  if (content.newName === content.oldName) return null;

  return <div>The name was changed to {content.newName}.</div>;
}

function Timeframe({ content }: { content: ActivityContentGoalEditing }) {
  const oldTimeframe = Timeframes.parse(content.newTimeframe!);
  const newTimeframe = Timeframes.parse(content.oldTimeframe!);

  if (Timeframes.equalDates(oldTimeframe, newTimeframe)) return null;

  return <div>The timeframe was changed to {Timeframes.format(newTimeframe)}.</div>;
}

function Champion({ content }: { content: ActivityContentGoalEditing }) {
  if (content.oldChampionId === content.newChampionId) return null;

  return <div>The champion was changed to {content.newChampion!.fullName}.</div>;
}

function Reviewer({ content }: { content: ActivityContentGoalEditing }) {
  if (content.oldReviewerId === content.newReviewerId) return null;

  return <div>The reviewer was changed to {content.newReviewer!.fullName}.</div>;
}

function AddedTargets({ content }: { content: ActivityContentGoalEditing }) {
  if (!content.addedTargets) return null;
  if (content.addedTargets.length === 0) return null;

  return (
    <div className="not-first:mt-2">
      The following measures were added:
      <ul>
        {content.addedTargets.map((target) => (
          <li key={target!.id}>- {target!.name}</li>
        ))}
      </ul>
    </div>
  );
}

function UpdatedTargets({ content }: { content: ActivityContentGoalEditing }) {
  const updated = content.updatedTargets!.filter((t) => t!.oldName !== t!.newName);

  if (updated.length === 0) return null;

  return (
    <div className="not-first:mt-2">
      The following measures were updated:
      <ul>
        {updated.map((target) => (
          <li key={target!.id}>- {target!.newName}</li>
        ))}
      </ul>
    </div>
  );
}

function DeletedTargets({ content }: { content: ActivityContentGoalEditing }) {
  if (!content.deletedTargets) return null;
  if (content.deletedTargets.length === 0) return null;

  return (
    <div className="not-first:mt-2">
      The following measures were removed:
      <ul>
        {content.deletedTargets.map((target) => (
          <li key={target!.id}>- {target!.name}</li>
        ))}
      </ul>
    </div>
  );
}
