import * as People from "@/models/people";
import React from "react";

import type { ActivityContentProjectContributorsAddition, ProjectContributorsAdditionContributor } from "@/api";
import type { Activity } from "@/models/activities";
import type { ActivityHandler } from "../interfaces";

import { Avatar } from "turboui";
import { feedTitle, projectLink } from "./../feedItemLinks";

const ProjectContributorsAddition: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, activity: Activity): string {
    const { project } = content(activity);

    return project ? paths.projectPath(project.id) : "#";
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
    const { project } = content(activity);

    const projectLinkOrName = project ? ["the", projectLink(project), "project"] : ["a project"];

    if (page === "project") {
      return feedTitle(activity, "added new contributors to the project");
    } else {
      return feedTitle(activity, "added new contributors to", ...projectLinkOrName);
    }
  },

  FeedItemContent({ activity }: { activity: Activity }) {
    return (
      <div className="flex flex-col gap-2 mt-2">
        {content(activity).contributors?.map((c, idx) => <FeedContent c={c} key={idx} />)}
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

  NotificationTitle(_props: { activity: Activity }) {
    return "Added you as a contributor";
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).project?.name || "Project";
  },
};

function content(activity: Activity): ActivityContentProjectContributorsAddition {
  return activity.content as ActivityContentProjectContributorsAddition;
}

export default ProjectContributorsAddition;

function FeedContent({ c }: { c?: ProjectContributorsAdditionContributor | null }) {
  if (!c?.person) {
    return null;
  }

  return (
    <div key={c.person.id} className="flex items-center gap-1">
      <Avatar person={c.person} size={20} />
      <span>{People.firstName(c.person)}</span>
      {c.responsibility && <> &ndash; {c.responsibility}</>}
    </div>
  );
}
