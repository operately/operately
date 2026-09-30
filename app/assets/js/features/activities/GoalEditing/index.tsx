import * as Timeframes from "@/utils/timeframes";
import * as React from "react";

import type { ActivityContentGoalEditing } from "@/api";
import type { Activity } from "@/models/activities";
import type { ActivityHandler, FeedItemProps } from "../interfaces";

import { compareIds } from "@/routes/paths";
import { Trans } from "../i18n";
import i18n from "@/i18n";
import { assertPresent } from "@/utils/assertions";
import { activityAuthorName, goalLink } from "../feedItemLinks";

const GoalEditing: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, activity: Activity): string {
    return paths.goalPath(content(activity).goal!.id!);
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

  FeedItemTitle({ activity, page, paths }: FeedItemProps) {
    if (page === "goal") {
      return <Trans i18nKey="{{author}} edited the goal" values={{ author: activityAuthorName(activity) }} />;
    } else {
      const goal = content(activity).goal;
      assertPresent(goal, "Goal is required for an editing activity");
      return (
        <Trans
          i18nKey="{{author}} edited the <goal>{{goalName}}</goal> goal"
          values={{ author: activityAuthorName(activity), goalName: goal.name }}
          components={{ goal: goalLink(paths, goal) }}
        />
      );
    }
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

  feedItemAlignment(_activity: Activity): "items-start" | "items-center" {
    return "items-start";
  },

  commentCount(_activity: Activity): number {
    throw new Error("Not implemented");
  },

  hasComments(_activity: Activity): boolean {
    throw new Error("Not implemented");
  },

  NotificationTitle({ activity }: { activity: Activity }) {
    return shortDesc(content(activity));
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).goal!.name!;
  },
};

function content(activity: Activity): ActivityContentGoalEditing {
  return activity.content as ActivityContentGoalEditing;
}

export default GoalEditing;

function NewName({ content }: { content: ActivityContentGoalEditing }) {
  if (content.newName === content.oldName) return null;

  return (
    <div>
      <Trans i18nKey="The name was changed to {{name}}." values={{ name: content.newName }} />
    </div>
  );
}

function Timeframe({ content }: { content: ActivityContentGoalEditing }) {
  const oldTimeframe = content.newTimeframe!;
  const newTimeframe = content.oldTimeframe!;

  if (Timeframes.equalDates(oldTimeframe, newTimeframe)) return null;

  return (
    <div>
      <Trans
        i18nKey="The timeframe was changed to {{timeframe}}."
        values={{ timeframe: Timeframes.getTimeframeRange(newTimeframe) }}
      />
    </div>
  );
}

function Champion({ content }: { content: ActivityContentGoalEditing }) {
  if (compareIds(content.oldChampionId, content.newChampionId)) return null;

  return (
    <div>
      <Trans
        i18nKey="The champion was changed to {{personName}}."
        values={{ personName: content.newChampion?.fullName }}
      />
    </div>
  );
}

function Reviewer({ content }: { content: ActivityContentGoalEditing }) {
  if (compareIds(content.oldReviewerId, content.newReviewerId)) return null;

  return (
    <div>
      <Trans
        i18nKey="The reviewer was changed to {{personName}}."
        values={{ personName: content.newReviewer?.fullName }}
      />
    </div>
  );
}

function AddedTargets({ content }: { content: ActivityContentGoalEditing }) {
  if (!content.addedTargets) return null;
  if (content.addedTargets.length === 0) return null;

  return (
    <div className="not-first:mt-2">
      <Trans i18nKey="The following measures were added:" />
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
      <Trans i18nKey="The following measures were updated:" />
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
      <Trans i18nKey="The following measures were removed:" />
      <ul>
        {content.deletedTargets.map((target) => (
          <li key={target!.id}>- {target!.name}</li>
        ))}
      </ul>
    </div>
  );
}

function shortDesc(content: ActivityContentGoalEditing): string {
  const { oldTimeframe, newTimeframe } = content;

  const changes = {
    name: content.oldName !== content.newName,
    timeframe: !Timeframes.equalDates(oldTimeframe, newTimeframe),
    champion: content.oldChampionId !== content.newChampionId,
    reviewer: content.oldReviewerId !== content.newReviewerId,
    measurements: content.addedTargets!.length + content.updatedTargets!.length + content.deletedTargets!.length > 0,
  };

  const labels = {
    name: i18n.t("name"),
    timeframe: i18n.t("timeframe"),
    champion: i18n.t("champion"),
    reviewer: i18n.t("reviewer"),
    measurements: i18n.t("measurements"),
  };
  const activeChanges = (Object.keys(changes) as Array<keyof typeof changes>)
    .filter((key) => changes[key])
    .map((key) => labels[key]);
  const list = new Intl.ListFormat(i18n.resolvedLanguage, { style: "long", type: "conjunction" }).format(activeChanges);
  return i18n.t("changed the goal's {{changes}}", { changes: list });
}
