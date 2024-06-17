import * as People from "@/models/people";

import type { Activity } from "@/models/activities";
import type { ActivityContentProjectArchived } from "@/api";
import type { ActivityHandler } from "../interfaces";

import { projectLink, feedTitle } from "../feedItemLinks";
import { Paths } from "@/routes/paths";

const ProjectArchived: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(activity: Activity) {
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
      return feedTitle(activity, "archived the project");
    } else {
      return feedTitle(activity, "archived the", projectLink(content(activity).project!), "project");
    }
  },

  FeedItemContent(_props: { activity: Activity; page: any }) {
    return null;
  },

  commentCount(_activity: Activity): number {
    throw new Error("Not implemented");
  },

  hasComments(_activity: Activity): boolean {
    throw new Error("Not implemented");
  },

  NotificationTitle({ activity }: { activity: Activity }) {
    return People.firstName(activity.author!) + " archived the " + content(activity).project!.name! + " project";
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).project!.name!;
  },
};

function content(activity: Activity): ActivityContentProjectArchived {
  return activity.content as ActivityContentProjectArchived;
}

export default ProjectArchived;
