import React from "react";
import type { ActivityContentMilestoneDescriptionUpdating } from "@/api";
import type { Activity } from "@/models/activities";
import { Paths } from "@/routes/paths";
import { Trans } from "../i18n";
import i18n from "@/i18n";
import { activityAuthorName, milestoneLink, projectLink } from "../feedItemLinks";
import type { ActivityHandler, FeedItemProps } from "../interfaces";
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

  FeedItemTitle({ activity, page, paths }: FeedItemProps) {
    const { project, milestone, milestoneName, hasDescription } = content(activity);
    const title = milestone ? milestoneLink(paths, milestone, milestoneName) : <React.Fragment />;
    const sentence =
      page === "project"
        ? hasDescription
          ? i18n.t("{{author}} updated milestone <milestone>{{title}}</milestone> description")
          : i18n.t("{{author}} removed description from milestone <milestone>{{title}}</milestone>")
        : hasDescription
          ? i18n.t(
              "{{author}} updated milestone <milestone>{{title}}</milestone> description in <project>{{projectName}}</project>",
            )
          : i18n.t(
              "{{author}} removed description from milestone <milestone>{{title}}</milestone> in <project>{{projectName}}</project>",
            );
    return (
      <Trans
        defaults={sentence}
        values={{
          author: activityAuthorName(activity),
          title: milestone ? milestoneName || milestone.title : `"${milestoneName}"`,
          projectName: project.name,
        }}
        components={{ milestone: title, project: projectLink(paths, project) }}
      />
    );
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
      return i18n.t('Milestone "{{title}}" description was updated', { title: String(milestone?.title) });
    } else {
      return i18n.t('Milestone "{{title}}" description was removed', { title: String(milestone?.title) });
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
