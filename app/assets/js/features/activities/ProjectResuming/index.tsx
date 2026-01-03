import * as React from "react";

import { feedTitle, projectLink } from "../feedItemLinks";

import type { ActivityContentProjectResuming } from "@/api";
import type { Activity } from "@/models/activities";
import type { ActivityHandler } from "../interfaces";
import { usePaths } from "@/routes/paths";
import { isContentEmpty, Link, RichContent, Summary } from "turboui";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";

const ProjectResuming: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    return "Project resumed";
  },

  pagePath(paths, activity: Activity): string {
    if (activity.id) {
      return paths.projectActivityPath(activity.id);
    }

    const projectId = content(activity).project?.id;
    return projectId ? paths.projectPath(projectId) : paths.homePath();
  },

  PageTitle(_props: { activity: any }) {
    return <>Project resumed</>;
  },

  PageContent({ activity }: { activity: Activity }) {
    const { mentionedPersonLookup } = useRichEditorHandlers();

    return (
      <div>
        {activity.commentThread && !isContentEmpty(activity.commentThread.message) && (
          <RichContent
            content={activity.commentThread.message}
            mentionedPersonLookup={mentionedPersonLookup}
            parseContent
          />
        )}
      </div>
    );
  },

  PageOptions(_props: { activity: Activity }) {
    return null;
  },

  FeedItemTitle({ activity, page }: { activity: Activity; page: any }) {
    const paths = usePaths();
    const activityPath = activity.id ? paths.projectActivityPath(activity.id) : null;
    const link = activityPath ? <Link to={activityPath}>resumed</Link> : "resumed";
    const project = content(activity).project;

    if (page === "project") {
      return feedTitle(activity, link, "the project");
    } else if (project) {
      return feedTitle(activity, link, "the", projectLink(project), "project");
    } else {
      return feedTitle(activity, link, "a project");
    }
  },

  FeedItemContent({ activity }: { activity: Activity }) {
    const { mentionedPersonLookup } = useRichEditorHandlers();

    return (
      <div>
        {activity.commentThread && !isContentEmpty(activity.commentThread.message) && (
          <Summary
            content={activity.commentThread.message}
            characterCount={300}
            mentionedPersonLookup={mentionedPersonLookup}
          />
        )}
      </div>
    );
  },

  feedItemAlignment(_activity: Activity): "items-start" | "items-center" {
    return "items-center";
  },

  commentCount(activity: Activity): number {
    return activity.commentThread?.commentsCount || 0;
  },

  hasComments(activity: Activity): boolean {
    return !!activity.commentThread;
  },

  NotificationTitle({ activity }: { activity: Activity }) {
    const projectName = content(activity).project?.name;
    return projectName ? `Resumed the ${projectName} project` : "Resumed a project";
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).project?.name || null;
  },
};

function content(activity: Activity): ActivityContentProjectResuming {
  return activity.content as ActivityContentProjectResuming;
}

export default ProjectResuming;
