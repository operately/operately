import * as People from "@/models/people";

import type { ActivityContentProjectContributorAddition } from "@/api";
import type { Activity } from "@/models/activities";
import type { ActivityHandler } from "../interfaces";


import { feedTitle, projectLink } from "./../feedItemLinks";

const ProjectContributorAddition: ActivityHandler = {
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
    const person = People.firstName(content(activity).person!);
    const project = projectLink(content(activity).project!);

    if (page === "project") {
      return feedTitle(activity, "added", person, "to the project");
    } else {
      return feedTitle(activity, "added", person, "to the", project, "project");
    }
  },

  FeedItemContent(_props: { activity: Activity; page: any }) {
    return null;
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

  NotificationTitle({ activity }: { activity: Activity }) {
    return People.firstName(activity.author!) + " added you as a contributor";
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).project!.name!;
  },
};

function content(activity: Activity): ActivityContentProjectContributorAddition {
  return activity.content as ActivityContentProjectContributorAddition;
}

export default ProjectContributorAddition;
