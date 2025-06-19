import * as People from "@/models/people";
import React from "react";

import type { ActivityContentGoalChampionUpdating } from "@/api";
import type { Activity } from "@/models/activities";
import { Paths } from "@/routes/paths";
import { feedTitle, goalLink } from "../feedItemLinks";
import type { ActivityHandler } from "../interfaces";

const GoalChampionUpdating: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths: Paths, _activity: Activity) {
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

  FeedItemTitle({ activity, page }: { activity: Activity; page: string }) {
    const goal = content(activity).goal!;
    const newChampion = content(activity).newChampion;
    const message = newChampion ? `assigned ${People.shortName(newChampion)} as the champion` : "removed the champion";

    if (page === "goal") {
      return feedTitle(activity, message);
    } else {
      return feedTitle(activity, message, "on", goalLink(goal));
    }
  },

  FeedItemContent({ activity }: { activity: Activity; page: any }) {
    const oldChampion = content(activity).oldChampion;

    if (oldChampion) {
      return <>Previously, {People.shortName(oldChampion)} was the champion.</>;
    } else {
      return <>There was no previous champion.</>;
    }
  },

  feedItemAlignment(_activity: Activity): "items-start" | "items-center" {
    return "items-center";
  },

  commentCount(_activity: Activity): number {
    throw new Error("Not implemented");
  },

  hasComments(_activity: Activity): boolean {
    throw new Error("Not implemented");
  },

  NotificationTitle(_props: { activity: Activity }) {
    return null;
  },

  NotificationLocation(_props: { activity: Activity }) {
    return null;
  },
};

function content(activity: Activity): ActivityContentGoalChampionUpdating {
  return activity.content as ActivityContentGoalChampionUpdating;
}

export default GoalChampionUpdating;
