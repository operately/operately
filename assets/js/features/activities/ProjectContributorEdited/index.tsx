import * as React from "react";
import * as People from "@/models/people";

import type { ActivityContentProjectContributorEdited } from "@/api";
import type { Activity } from "@/models/activities";
import type { ActivityHandler } from "../interfaces";

import { feedTitle, projectLink } from "../feedItemLinks";
import { Paths, compareIds } from "@/routes/paths";
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

    if (personChanged(activity)) {
      const newRole = content(activity).updatedContributor!.role!;

      if (page === "project") {
        return feedTitle(activity, "set", person, "as the new", newRole);
      } else {
        return feedTitle(activity, "set", person, "as the new", newRole, "on the", project, "project");
      }
    }

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

    if (page === "project") {
      return feedTitle(activity, "updated", person + "'s", "role");
    } else {
      return feedTitle(activity, "updated", person + "'s", "role on the", project, "project");
    }
  },

  FeedItemContent({ activity }: { activity: Activity }) {
    if (personChanged(activity)) {
      const oldRole = content(activity).updatedContributor!.role!;
      const oldName = People.firstName(content(activity).previousContributor!.person!);
      const newRole = content(activity).previousContributor!.role!;

      return (
        <div className="text-xs">
          The previous {oldRole} {oldName} is now a {newRole}
        </div>
      );
    }

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
  return content(activity).previousContributor?.role !== content(activity).updatedContributor?.role;
}

function accessChanged(activity: Activity): boolean {
  return content(activity).previousContributor?.permissions !== content(activity).updatedContributor?.permissions;
}

function personChanged(activity: Activity): boolean {
  const oldId = content(activity).previousContributor?.person?.id;
  const newId = content(activity).updatedContributor?.person?.id;

  return !compareIds(oldId, newId);
}

export default ProjectContributorEdited;
