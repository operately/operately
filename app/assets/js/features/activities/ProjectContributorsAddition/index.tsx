import * as People from "@/models/people";
import React from "react";

import type { ActivityContentProjectContributorsAddition } from "@/api";
import type { Activity } from "@/models/activities";
import type { ActivityHandler } from "../interfaces";


import { Avatar } from "turboui";
import { feedTitle, projectLink } from "./../feedItemLinks";

const ProjectContributorsAddition: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, activity: Activity): string {
    return paths.projectPath(content(activity).project!.id!);
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
    const project = projectLink(content(activity).project!);

    if (page === "project") {
      return feedTitle(activity, "added new contributors to the project");
    } else {
      return feedTitle(activity, "added new contributors to the", project, "project");
    }
  },

  FeedItemContent({ activity }: { activity: Activity }) {
    return (
      <div className="flex flex-col gap-2 mt-2">
        {content(activity).contributors!.map((c) => (
          <div key={c.person!.id} className="flex items-center gap-1">
            <Avatar person={c.person!} size={20} /> <span>{People.firstName(c.person!)}</span> &ndash;{" "}
            {c.responsibility}
          </div>
        ))}
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
    return "Added you as a contributor";
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).project!.name!;
  },
};

function content(activity: Activity): ActivityContentProjectContributorsAddition {
  return activity.content as ActivityContentProjectContributorsAddition;
}

export default ProjectContributorsAddition;
