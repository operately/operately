import React from "react";

import type { ActivityContentResourceHubFileEdited } from "@/api";
import type { Activity } from "@/models/activities";

import { Trans } from "../i18n";
import i18n from "@/i18n";
import { activityAuthorName, fileLink } from "../feedItemLinks";
import type { ActivityHandler, FeedItemProps } from "../interfaces";
import { Summary } from "turboui";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import { resourceHubLocationName, resourceHubPathOrParent, visibleParentDescriptor } from "../resourceHubActivity";

const ResourceHubFileEdited: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, activity: Activity) {
    const data = content(activity);

    if (data.file?.id) {
      return paths.resourceHubFilePath(data.file.id);
    }

    return resourceHubPathOrParent(paths, data);
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
    const data = content(activity);
    const file = data.file?.id && data.file?.name ? fileLink(paths, data.file) : <React.Fragment />;
    const parent = visibleParentDescriptor(paths, page, data);

    const sentence =
      parent?.page === "project"
        ? i18n.t("{{author}} edited a file in the <parent>{{parentName}}</parent> project: <file>{{fileName}}</file>")
        : parent?.page === "goal"
          ? i18n.t("{{author}} edited a file in the <parent>{{parentName}}</parent> goal: <file>{{fileName}}</file>")
          : parent
            ? i18n.t("{{author}} edited a file in the <parent>{{parentName}}</parent> space: <file>{{fileName}}</file>")
            : i18n.t("{{author}} edited a file: <file>{{fileName}}</file>");
    return (
      <Trans
        defaults={sentence}
        values={{
          author: activityAuthorName(activity),
          fileName: data.file?.name ?? i18n.t("a file"),
          parentName: parent?.name,
        }}
        components={{ file, parent: parent?.link ?? <React.Fragment /> }}
      />
    );
  },

  FeedItemContent({ activity }: { activity: Activity; page: any }) {
    const { file } = content(activity);
    const { mentionedPersonLookup } = useRichEditorHandlers();

    return <Summary content={file?.description} characterCount={160} mentionedPersonLookup={mentionedPersonLookup} />;
  },

  feedItemAlignment(_activity: Activity): "items-start" | "items-center" {
    return "items-center";
  },

  commentCount(_activity: Activity): number {
    throw new Error("Not implemented");
  },

  hasComments(_activity: Activity): boolean {
    throw new Error("Not implemented");
  },

  NotificationTitle({ activity }: { activity: Activity }) {
    const name = content(activity).file?.name;
    return name == null ? i18n.t("Edited a file") : i18n.t("Edited a file: {{fileName}}", { fileName: name });
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return resourceHubLocationName(content(activity));
  },
};

function content(activity: Activity): ActivityContentResourceHubFileEdited {
  return activity.content as ActivityContentResourceHubFileEdited;
}

export default ResourceHubFileEdited;
