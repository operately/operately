import * as React from "react";
import * as People from "@/models/people";

import type { Activity } from "@/models/activities";
import type { ActivityContentProjectRenamed } from "@/api";
import type { ActivityHandler } from "../interfaces";

import { feedTitle, projectLink } from "../feedItemLinks";
import { Paths } from "@/routes/paths";

const ProjectRenamed: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(activity: Activity): string {
    return Paths.projectPath(content(activity).project!.id!);
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
    if (page === "project") {
      return feedTitle(activity, "renamed the project");
    } else {
      return feedTitle(activity, "renamed the", projectLink(content(activity).project!), "project");
    }
  },

  FeedItemContent({ activity }: { activity: Activity }) {
    return (
      <>
        <span className="line-through">{content(activity).oldName}</span> → {content(activity).newName}
      </>
    );
  },

  commentCount(_activity: Activity): number {
    throw new Error("Not implemented");
  },

  hasComments(_activity: Activity): boolean {
    throw new Error("Not implemented");
  },

  NotificationTitle({ activity }: { activity: Activity }) {
    const oldName = content(activity).oldName;
    const newName = content(activity).newName;

    return People.firstName(activity.author!) + " renamed " + oldName + " to " + newName;
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).project!.name!;
  },
};

function content(activity: Activity): ActivityContentProjectRenamed {
  return activity.content as ActivityContentProjectRenamed;
}

export default ProjectRenamed;
