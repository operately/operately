import * as React from "react";
import * as People from "@/models/people";

import type { ActivityContentProjectContributorEdited } from "@/api";
import type { Activity } from "@/models/activities";
import type { ActivityHandler } from "../interfaces";

import { feedTitle, projectLink } from "../feedItemLinks";
import { Paths } from "@/routes/paths";
import { accessLevelAsString } from "@/features/Permissions";

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
    const person = People.firstName(content(activity).updatedContributor!.person!);

    if (roleChanged(activity)) {
      const person = People.firstName(content(activity).updatedContributor!.person!);
      const newRole = content(activity).updatedContributor!.role!;

      if (page === "project") {
        return feedTitle(activity, "reassigned", person, "as a", newRole, "on the project");
      } else {
        return feedTitle(activity, "reassigned", person, "as a", newRole, "on the", project, "project");
      }
    }

    if (accessChanged(activity)) {
      if (page === "project") {
        return feedTitle(activity, "edited", person + "'s", "access");
      } else {
        return feedTitle(activity, "edited", person + "'s", "access on the", project, "project");
      }
    }

    // not yet implemented
    return null;
  },

  FeedItemContent({ activity }: { activity: Activity }) {
    if (roleChanged(activity)) {
      const oldRole = content(activity).previousContributor!.role!;
      const person = People.firstName(content(activity).updatedContributor!.person!);

      return (
        <div className="text-xs">
          Previously {person} was a {oldRole}
        </div>
      );
    }

    if (accessChanged(activity)) {
      const person = People.firstName(content(activity).updatedContributor!.person!);
      const newAccess = content(activity).updatedContributor!.permissions!;
      const newAccessText = accessLevelAsString(newAccess).toLowerCase();

      return (
        <div className="text-xs">
          {person} now has {newAccessText} on this project
        </div>
      );
    }

    // not yet implemented
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

function accessChanged(activity: Activity): boolean {
  return (
    content(activity).previousContributor?.permissions !== content(activity).updatedContributor?.permissions &&
    content(activity).previousContributor?.personId === content(activity).updatedContributor?.personId
  );
}

export default ProjectContributorEdited;
