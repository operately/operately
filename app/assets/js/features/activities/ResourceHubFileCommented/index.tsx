import React from "react";
import * as People from "@/models/people";

import type { ActivityContentResourceHubFileCommented } from "@/api";
import type { Activity } from "@/models/activities";
import type { ActivityHandler, FeedItemProps } from "../interfaces";

import { Trans } from "../i18n";
import i18n from "@/i18n";
import { activityAuthorName, commentedLink, fileLink } from "../feedItemLinks";
import { Summary } from "turboui";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import { parseCommentContent } from "@/models/comments";
import { commentedResourcePath, visibleParentDescriptor } from "../resourceHubActivity";

const ResourceHubFileCommented: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, activity: Activity): string {
    const data = content(activity);
    const resourcePath = data.file?.id ? paths.resourceHubFilePath(data.file.id) : null;

    return commentedResourcePath(paths, data, resourcePath, data.comment);
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
    const parent = visibleParentDescriptor(paths, page, data);
    let action: string | JSX.Element = "commented";
    let file = <React.Fragment />;

    if (data.file) {
      file = fileLink(paths, data.file);
    }

    if (data.file?.id) {
      action = commentedLink(paths.resourceHubFilePath(data.file.id), data.comment);
    }

    const sentence =
      parent?.page === "project"
        ? i18n.t(
            "{{author}} <action>commented</action> on <file>{{fileName}}</file> in the <parent>{{parentName}}</parent> project",
          )
        : parent?.page === "goal"
          ? i18n.t(
              "{{author}} <action>commented</action> on <file>{{fileName}}</file> in the <parent>{{parentName}}</parent> goal",
            )
          : parent
            ? i18n.t(
                "{{author}} <action>commented</action> on <file>{{fileName}}</file> in the <parent>{{parentName}}</parent> space",
              )
            : i18n.t("{{author}} <action>commented</action> on <file>{{fileName}}</file>");
    return (
      <Trans
        defaults={sentence}
        values={{
          author: activityAuthorName(activity),
          fileName: data.file?.name ?? i18n.t("a file"),
          parentName: parent?.name,
        }}
        components={{
          action: typeof action === "string" ? <React.Fragment /> : action,
          file,
          parent: parent?.link ?? <React.Fragment />,
        }}
      />
    );
  },

  FeedItemContent({ activity }: { activity: Activity }) {
    const { comment } = content(activity);
    const { mentionedPersonLookup } = useRichEditorHandlers({
      scope: People.NoneSearchScope,
    });
    const commentContent = parseCommentContent(comment?.content);

    if (!commentContent) {
      return null;
    }

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

  NotificationTitle({ activity }: { activity: Activity }) {
    const title = content(activity).file?.name;
    return title ? i18n.t("Re: {{title}}", { title }) : i18n.t("Re: a file");
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).file?.name || i18n.t("a file");
  },
};

function content(activity: Activity): ActivityContentResourceHubFileCommented {
  return activity.content as ActivityContentResourceHubFileCommented;
}

export default ResourceHubFileCommented;
