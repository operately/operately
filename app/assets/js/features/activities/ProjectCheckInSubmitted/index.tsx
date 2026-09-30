import * as React from "react";

import type { ActivityContentProjectCheckInSubmitted } from "@/api";
import type { Activity } from "@/models/activities";
import type { ActivityHandler, FeedItemProps } from "../interfaces";

import { SmallStatusIndicator, Summary } from "turboui";
import { Trans } from "../i18n";
import i18n from "@/i18n";
import { activityAuthorName, projectCheckInLink, projectLink } from "./../feedItemLinks";
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

  FeedItemTitle({ activity, page, paths }: FeedItemProps) {
    const project = content(activity).project!;
    const checkInLink = projectCheckInLink(paths, content(activity).checkIn);
    const checkIn = typeof checkInLink === "string" ? <React.Fragment /> : checkInLink;

    if (page === "project") {
      return (
        <Trans
          i18nKey="{{author}} submitted a <checkIn>Check-In</checkIn>"
          values={{ author: activityAuthorName(activity) }}
          components={{ checkIn }}
        />
      );
    } else {
      return (
        <Trans
          i18nKey="{{author}} submitted a <checkIn>Check-In</checkIn> in the <project>{{projectName}}</project> project"
          values={{ author: activityAuthorName(activity), projectName: project.name }}
          components={{ checkIn, project: projectLink(paths, project) }}
        />
      );
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
    return i18n.t("Submitted a check-in");
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).project!.name!;
  },
};

function content(activity: Activity): ActivityContentProjectCheckInSubmitted {
  return activity.content as ActivityContentProjectCheckInSubmitted;
}

export default ProjectCheckInSubmitted;
