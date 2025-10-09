import React from "react";
import type { ActivityContentMilestoneDescriptionUpdating } from "@/api";
import type { Activity } from "@/models/activities";
import { Paths } from "@/routes/paths";
import { feedTitle, milestoneLink, projectLink } from "../feedItemLinks";
import type { ActivityHandler } from "../interfaces";
import { Summary } from "turboui";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";

const MilestoneDescriptionUpdating: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths: Paths, activity: Activity) {
    const { milestone } = content(activity);

    if (milestone) {
      return paths.projectMilestonePath(milestone.id);
    } else {
      return paths.homePath();
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

  FeedItemTitle({ activity, page }: { activity: Activity; page: string }) {
    const { project, milestone, milestoneName, hasDescription } = content(activity);
    const title = milestone ? milestoneLink(milestone, milestoneName) : `"${milestoneName}"`;

    const message = hasDescription
      ? ["updated milestone", title, "description"]
      : ["removed description from milestone", title];

    if (page === "project") {
      return feedTitle(activity, ...message);
    } else {
      return feedTitle(activity, ...message, "in", projectLink(project));
    }
  },

  FeedItemContent({ activity }: { activity: Activity; page: any }) {
    const data = content(activity);
    const { mentionedPersonLookup } = useRichEditorHandlers();

    const rawDescription = data.description ?? data.milestone?.description;
    if (!rawDescription) return null;

    const description = typeof rawDescription === "string" ? safeParseDescription(rawDescription) : rawDescription;

    if (!description) return null;

    return <Summary content={description} characterCount={200} mentionedPersonLookup={mentionedPersonLookup} />;
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

  NotificationTitle(props: { activity: Activity }) {
    const { milestone, hasDescription } = content(props.activity);

    if (hasDescription) {
      return `Milestone "${milestone?.title}" description was updated`;
    } else {
      return `Milestone "${milestone?.title}" description was removed`;
    }
  },

  NotificationLocation(props: { activity: Activity }) {
    return content(props.activity).project!.name!;
  },
};

function content(activity: Activity): ActivityContentMilestoneDescriptionUpdating {
  return activity.content as ActivityContentMilestoneDescriptionUpdating;
}

function safeParseDescription(description: string) {
  try {
    return JSON.parse(description);
  } catch (_err) {
    return null;
  }
}

export default MilestoneDescriptionUpdating;
