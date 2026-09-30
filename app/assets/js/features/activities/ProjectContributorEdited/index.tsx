import * as People from "@/models/people";
import * as React from "react";

import type {
  ActivityContentProjectContributorEdited,
  ActivityContentProjectContributorEditedContributor,
} from "@/api";
import type { Activity } from "@/models/activities";
import type { ActivityHandler, FeedItemProps } from "../interfaces";

import { accessLevelAsString } from "@/features/Permissions";
import { compareIds } from "@/routes/paths";
import { Trans } from "../i18n";
import i18n from "@/i18n";
import { activityAuthorName, projectLink } from "../feedItemLinks";

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

  FeedItemTitle({ activity, page, paths }: FeedItemProps) {
    const { project, updatedContributor } = content(activity);
    const person = contributorFirstName(updatedContributor);
    const values = {
      author: activityAuthorName(activity),
      personName: person,
      role: roleName(updatedContributor?.role),
      projectName: project?.name,
    };
    const components = { project: project ? projectLink(paths, project) : <React.Fragment /> };

    if (personChanged(activity)) {
      if (page === "project") {
        return <Trans i18nKey="{{author}} set {{personName}} as the new {{role}}" values={values} />;
      } else if (project) {
        return <Trans i18nKey="{{author}} set {{personName}} as the new {{role}} on the <project>{{projectName}}</project> project" values={values} components={components} />;
      } else {
        return <Trans i18nKey="{{author}} set {{personName}} as the new {{role}} on a project" values={values} />;
      }
    }

    if (roleChanged(activity)) {
      if (page === "project") {
        return <Trans i18nKey="{{author}} reassigned {{personName}} as a {{role}} on the project" values={values} />;
      } else if (project) {
        return <Trans i18nKey="{{author}} reassigned {{personName}} as a {{role}} on the <project>{{projectName}}</project> project" values={values} components={components} />;
      } else {
        return <Trans i18nKey="{{author}} reassigned {{personName}} as a {{role}} on a project" values={values} />;
      }
    }

    if (accessChanged(activity)) {
      if (page === "project") {
        return <Trans i18nKey="{{author}} edited {{personName}}'s access" values={values} />;
      } else if (project) {
        return <Trans i18nKey="{{author}} edited {{personName}}'s access on the <project>{{projectName}}</project> project" values={values} components={components} />;
      } else {
        return <Trans i18nKey="{{author}} edited {{personName}}'s access on a project" values={values} />;
      }
    }

    if (page === "project") {
      return <Trans i18nKey="{{author}} updated {{personName}}'s role" values={values} />;
    } else if (project) {
      return <Trans i18nKey="{{author}} updated {{personName}}'s role on the <project>{{projectName}}</project> project" values={values} components={components} />;
    } else {
      return <Trans i18nKey="{{author}} updated {{personName}}'s role on a project" values={values} />;
    }
  },

  FeedItemContent({ activity }: { activity: Activity }) {
    if (personChanged(activity)) {
      const oldRole = roleName(content(activity).updatedContributor?.role);
      const oldName = contributorFirstName(content(activity).previousContributor);
      const newRole = roleName(content(activity).previousContributor?.role);

      return (
        <div className="text-xs">
          <Trans
            i18nKey="The previous {{oldRole}} {{oldName}} is now a {{newRole}}"
            values={{ oldRole, oldName, newRole }}
          />
        </div>
      );
    }

    if (roleChanged(activity)) {
      const oldRole = roleName(content(activity).previousContributor?.role);
      const person = contributorFirstName(content(activity).updatedContributor);

      return (
        <div className="text-xs">
          <Trans i18nKey="Previously {{personName}} was a {{oldRole}}" values={{ personName: person, oldRole }} />
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
          <Trans
            i18nKey="{{personName}} now has {{access}} on this project"
            values={{ personName: person, access: newAccessText }}
          />
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
  return contributor?.person ? People.firstName(contributor.person) : i18n.t("a contributor");
}

function roleName(role?: string | null): string {
  switch (role) {
    case "champion":
      return i18n.t("champion");
    case "reviewer":
      return i18n.t("reviewer");
    case "contributor":
      return i18n.t("contributor");
    default:
      return role || i18n.t("contributor");
  }
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
