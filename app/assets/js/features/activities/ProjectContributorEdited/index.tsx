import * as People from "@/models/people";
import * as React from "react";

import type {
  ActivityContentProjectContributorEdited,
  ActivityContentProjectContributorEditedContributor,
} from "@/api";
import type { Activity } from "@/models/activities";
import type { ActivityHandler } from "../interfaces";

import { accessLevelAsString } from "@/features/Permissions";
import { compareIds } from "@/routes/paths";
import { feedTitle, projectLink } from "../feedItemLinks";

const ProjectContributorEdited: ActivityHandler = {
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
    const { project, updatedContributor } = content(activity);
    const person = contributorFirstName(updatedContributor);
    const projectParts = project ? ["the", projectLink(project), "project"] : ["a project"];

    if (personChanged(activity)) {
      const newRole = updatedContributor?.role || "contributor";

      if (page === "project") {
        return feedTitle(activity, "set", person, "as the new", newRole);
      } else {
        return feedTitle(activity, "set", person, "as the new", newRole, "on", ...projectParts);
      }
    }

    if (roleChanged(activity)) {
      const newRole = updatedContributor?.role || "contributor";

      if (page === "project") {
        return feedTitle(activity, "reassigned", person, "as a", newRole, "on the project");
      } else {
        return feedTitle(activity, "reassigned", person, "as a", newRole, "on", ...projectParts);
      }
    }

    if (accessChanged(activity)) {
      if (page === "project") {
        return feedTitle(activity, "edited", person + "'s", "access");
      } else {
        return feedTitle(activity, "edited", person + "'s", "access on", ...projectParts);
      }
    }

    if (page === "project") {
      return feedTitle(activity, "updated", person + "'s", "role");
    } else {
      return feedTitle(activity, "updated", person + "'s", "role on", ...projectParts);
    }
  },

  FeedItemContent({ activity }: { activity: Activity }) {
    if (personChanged(activity)) {
      const oldRole = content(activity).updatedContributor?.role || "contributor";
      const oldName = contributorFirstName(content(activity).previousContributor);
      const newRole = content(activity).previousContributor?.role || "contributor";

      return (
        <div className="text-xs">
          The previous {oldRole} {oldName} is now a {newRole}
        </div>
      );
    }

    if (roleChanged(activity)) {
      const oldRole = content(activity).previousContributor?.role || "contributor";
      const person = contributorFirstName(content(activity).updatedContributor);

      return (
        <div className="text-xs">
          Previously {person} was a {oldRole}
        </div>
      );
    }

    if (accessChanged(activity)) {
      const person = contributorFirstName(content(activity).updatedContributor);
      const newAccess = content(activity).updatedContributor?.permissions;
      if (newAccess == null) return null;

      const newAccessText = accessLevelAsString(newAccess).toLowerCase();

      return (
        <div className="text-xs">
          {person} now has {newAccessText} on this project
        </div>
      );
    }

    return null;
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

function contributorFirstName(contributor?: ActivityContentProjectContributorEditedContributor | null) {
  return contributor?.person ? People.firstName(contributor.person) : "a contributor";
}

function contributorPersonId(contributor?: ActivityContentProjectContributorEditedContributor | null) {
  return contributor?.person?.id ?? contributor?.personId;
}

function roleChanged(activity: Activity): boolean {
  return content(activity).previousContributor?.role !== content(activity).updatedContributor?.role;
}

function accessChanged(activity: Activity): boolean {
  return content(activity).previousContributor?.permissions !== content(activity).updatedContributor?.permissions;
}

function personChanged(activity: Activity): boolean {
  return !compareIds(
    contributorPersonId(content(activity).previousContributor),
    contributorPersonId(content(activity).updatedContributor),
  );
}

export default ProjectContributorEdited;
