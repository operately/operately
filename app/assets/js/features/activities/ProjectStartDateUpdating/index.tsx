import type { ActivityContentProjectStartDateUpdating } from "@/api";
import type { Activity } from "@/models/activities";
import { Paths } from "@/routes/paths";
import React from "react";
import { FormattedTime } from "turboui";
import { feedTitle, projectLink } from "../feedItemLinks";
import type { ActivityHandler } from "../interfaces";

const ProjectStartDateUpdating: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(_paths: Paths, _activity: Activity) {
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

  FeedItemTitle(props: { activity: Activity; page: string }) {
    const { project, newStartDate } = content(props.activity);

    const message = newStartDate ? (
      <>
        changed the start date to <FormattedTime time={newStartDate} format="short-date" />
      </>
    ) : (
      "cleared the start date"
    );

    if (props.page === "project") {
      return feedTitle(props.activity, message);
    } else {
      return feedTitle(props.activity, message, " on the", projectLink(project!));
    }
  },

  FeedItemContent(props: { activity: Activity; page: any }) {
    const { oldStartDate } = content(props.activity);

    if (oldStartDate) {
      const time = <FormattedTime time={oldStartDate} format="short-date" />;

      return <>Previously the start date was {time}</>;
    } else {
      return <>Previously had no start date</>;
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
    return <></>;
  },

  NotificationLocation(_props: { activity: Activity }) {
    return null;
  },
};

function content(activity: Activity): ActivityContentProjectStartDateUpdating {
  return activity.content as ActivityContentProjectStartDateUpdating;
}

export default ProjectStartDateUpdating;
