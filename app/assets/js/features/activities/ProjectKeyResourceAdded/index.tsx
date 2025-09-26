import type { ActivityContentProjectKeyResourceAdded } from "@/api";
import type { Activity } from "@/models/activities";
import React from "react";
import type { ActivityHandler } from "../interfaces";


import { feedTitle, projectLink } from "../feedItemLinks";

const ProjectKeyResourceAdded: ActivityHandler = {
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
    if (page === "project") {
      return feedTitle(activity, "added a key resource to the project");
    } else {
      return feedTitle(activity, "added a key resource to the", projectLink(content(activity).project!), "project");
    }
  },

  FeedItemContent({ activity }: { activity: Activity; page: any }) {
    const title = content(activity).title;

    if (!title) return <></>;

    return (
      <div>
        Resource:
        <ul className="ml-4 list-disc">
          <li>{content(activity).title}</li>
        </ul>
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
    return (
      "Added a key resource to the " +
      content(activity).project!.name! +
      " project"
    );
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).project!.name!;
  },
};

function content(activity: Activity): ActivityContentProjectKeyResourceAdded {
  return activity.content as ActivityContentProjectKeyResourceAdded;
}

export default ProjectKeyResourceAdded;
