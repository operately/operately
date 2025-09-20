import * as People from "@/models/people";
import * as React from "react";

import type { ActivityContentProjectMoved } from "@/api";
import type { Activity } from "@/models/activities";
import type { ActivityHandler } from "../interfaces";

import { usePaths } from "@/routes/paths";
import { Link } from "turboui";
import { feedTitle, projectLink } from "../feedItemLinks";

const ProjectMoved: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, activity: Activity) {
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
      return feedTitle(activity, "moved the project");
    } else {
      return feedTitle(activity, "moved the", projectLink(content(activity).project!), "project");
    }
  },

  FeedItemContent({ activity }: { activity: Activity }) {
    const paths = usePaths();
    const oldSpace = content(activity).oldSpace!;
    const newSpace = content(activity).newSpace!;

    const oldSpacePath = paths.spacePath(oldSpace.id!);
    const newSpacePath = paths.spacePath(newSpace.id!);

    const oldLink = <Link to={oldSpacePath}>{oldSpace.name}</Link>;
    const newLink = <Link to={newSpacePath}>{newSpace.name}</Link>;

    return (
      <>
        From {oldLink} to {newLink}
      </>
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
    const oldSpace = content(activity).oldSpace!.name;
    const newSpace = content(activity).newSpace!.name;

    return "Moved the project from " + oldSpace + " to " + newSpace;
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).project!.name!;
  },
};

function content(activity: Activity): ActivityContentProjectMoved {
  return activity.content as ActivityContentProjectMoved;
}

export default ProjectMoved;
