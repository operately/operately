import * as People from "@/models/people";

import type { ActivityContentProjectContributorEdited } from "@/api";
import type { Activity } from "@/models/activities";
import type { ActivityHandler } from "../interfaces";

import { feedTitle, projectLink } from "../feedItemLinks";
import { Paths } from "@/routes/paths";

const ProjectContributorEdited: ActivityHandler = {
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
    const project = projectLink(content(activity).project!);

    if (roleChanged(activity)) {
      console.log(activity);
      const person = People.shortName(content(activity).updatedContributor!.person!);
      const newRole = content(activity).updatedContributor!.role!;

      if (page === "project") {
        return feedTitle(activity, "reassigned", person, "as a", newRole, "on the project");
      } else {
        return feedTitle(activity, "reassigned", person, "as a", newRole, "on the", project, "project");
      }
    } else {
      // Not yet implemented
      return null;
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

  NotificationTitle(_props: { activity: Activity }) {
    throw new Error("Not implemented");
  },

  NotificationLocation(_props: { activity: Activity }) {
    throw new Error("Not implemented");
  },
};

function content(activity: Activity): ActivityContentProjectContributorEdited {
  return activity.content as ActivityContentProjectContributorEdited;
}

function roleChanged(activity: Activity): boolean {
  return (
    content(activity).previousContributor?.role !== content(activity).updatedContributor?.role &&
    content(activity).previousContributor?.personId === content(activity).updatedContributor?.personId
  );
}

export default ProjectContributorEdited;
