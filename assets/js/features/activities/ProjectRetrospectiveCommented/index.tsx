import * as React from "react";
import * as People from "@/models/people";

import type { ActivityContentProjectRetrospectiveCommented } from "@/api";
import type { Activity } from "@/models/activities";
import type { ActivityHandler } from "../interfaces";

import { feedTitle, projectLink } from "./../feedItemLinks";
import { Paths } from "@/routes/paths";
import { Link } from "@/components/Link";
import { Summary } from "@/components/RichContent";

const ProjectRetrospectiveCommented: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(activity: Activity): string {
    return Paths.projectRetrospectivePath(content(activity).projectId!);
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
    const project = content(activity).project!;

    const retrospectivePath = Paths.projectRetrospectivePath(project.id!);
    const retrospectiveLink = <Link to={retrospectivePath}>Retrospective</Link>;

    if (page === "project") {
      return feedTitle(activity, "commented on ", retrospectiveLink);
    } else {
      return feedTitle(activity, "commented on ", retrospectiveLink, " in the ", projectLink(project), "project");
    }
  },

  FeedItemContent({ activity }: { activity: Activity }) {
    const comment = content(activity).comment!;
    const commentContent = JSON.parse(comment.content!)["message"];

    return <Summary jsonContent={commentContent} characterCount={200} />;
  },

  commentCount(_activity: Activity): number {
    throw new Error("Not implemented");
  },

  hasComments(_activity: Activity): boolean {
    throw new Error("Not implemented");
  },

  NotificationTitle({ activity }: { activity: Activity }) {
    return People.firstName(activity.author!) + " commented on the project retrospective";
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).project!.name!;
  },
};

function content(activity: Activity): ActivityContentProjectRetrospectiveCommented {
  return activity.content as ActivityContentProjectRetrospectiveCommented;
}

export default ProjectRetrospectiveCommented;
