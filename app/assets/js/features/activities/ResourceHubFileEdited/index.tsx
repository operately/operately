import React from "react";

import type { ActivityContentResourceHubFileEdited } from "@/api";
import type { Activity } from "@/models/activities";

import { feedTitle, fileLink } from "../feedItemLinks";
import type { ActivityHandler } from "../interfaces";
import { Summary } from "turboui";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import { resourceHubLocationName, resourceHubParentParts, resourceHubPathOrParent } from "../resourceHubActivity";

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

  FeedItemTitle({ activity, page }: { activity: Activity; page: any }) {
    const data = content(activity);
    const file = data.file?.id && data.file?.name ? fileLink(data.file) : data.file?.name ?? "a file";
    const parentParts = resourceHubParentParts(page, data);

    if (parentParts.length === 0) {
      return feedTitle(activity, "edited a file:", file);
    }

    return feedTitle(activity, "edited a file", ...parentParts, ":", file);
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
    return "Edited a file: " + (content(activity).file?.name ?? "a file");
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return resourceHubLocationName(content(activity));
  },
};

function content(activity: Activity): ActivityContentResourceHubFileEdited {
  return activity.content as ActivityContentResourceHubFileEdited;
}

export default ResourceHubFileEdited;
