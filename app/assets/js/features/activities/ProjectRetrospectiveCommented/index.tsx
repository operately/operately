import * as React from "react";

import type { ActivityContentProjectRetrospectiveCommented } from "@/api";
import type { Activity } from "@/models/activities";
import type { ActivityHandler } from "../interfaces";

import { usePaths } from "@/routes/paths";
import { Link, Summary } from "turboui";
import { feedTitle, projectLink } from "./../feedItemLinks";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";

const ProjectRetrospectiveCommented: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, activity: Activity): string {
    return paths.projectRetrospectivePath(content(activity).projectId!);
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
    const paths = usePaths();
    const project = content(activity).project!;

    const retrospectivePath = paths.projectRetrospectivePath(project.id!);
    const retrospectiveLink = <Link to={retrospectivePath}>Retrospective</Link>;

    if (page === "project") {
      return feedTitle(activity, "commented on ", retrospectiveLink);
    } else {
      return feedTitle(activity, "commented on ", retrospectiveLink, " in the ", projectLink(project), "project");
    }
  },

  FeedItemContent({ activity }: { activity: Activity }) {
    const { comment } = content(activity);
    const commentContent = comment?.content ? JSON.parse(comment.content)["message"] : "";

    const { mentionedPersonLookup } = useRichEditorHandlers();

    return <Summary content={commentContent} characterCount={200} mentionedPersonLookup={mentionedPersonLookup} />;
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
    return "Re: project retrospective";
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).project!.name!;
  },
};

function content(activity: Activity): ActivityContentProjectRetrospectiveCommented {
  return activity.content as ActivityContentProjectRetrospectiveCommented;
}

export default ProjectRetrospectiveCommented;
