import * as React from "react";

import type { ActivityContentProjectCheckInSubmitted } from "@/api";
import type { Activity } from "@/models/activities";
import type { ActivityHandler } from "../interfaces";

import { SmallStatusIndicator, Summary } from "turboui";
import { feedTitle, projectCheckInLink, projectLink } from "./../feedItemLinks";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";

const ProjectCheckInSubmitted: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, activity: Activity): string {
    const { checkIn, project } = content(activity);

    if (checkIn?.id) {
      return paths.projectCheckInPath(checkIn.id);
    } else {
      return paths.projectPath(project!.id);
    }
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
    const checkInLink = projectCheckInLink(content(activity).checkIn);

    if (page === "project") {
      return feedTitle(activity, "submitted a ", checkInLink);
    } else {
      return feedTitle(activity, "submitted a ", checkInLink, " in the ", projectLink(project), "project");
    }
  },

  FeedItemContent({ activity }: { activity: Activity }) {
    const { checkIn } = content(activity);
    const { mentionedPersonLookup } = useRichEditorHandlers();

    return (
      <div className="flex flex-col gap-2">
        {checkIn?.status && <SmallStatusIndicator status={checkIn?.status} />}
        <Summary content={checkIn?.description} characterCount={200} mentionedPersonLookup={mentionedPersonLookup} />
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
    return "Submitted a check-in";
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).project!.name!;
  },
};

function content(activity: Activity): ActivityContentProjectCheckInSubmitted {
  return activity.content as ActivityContentProjectCheckInSubmitted;
}

export default ProjectCheckInSubmitted;
