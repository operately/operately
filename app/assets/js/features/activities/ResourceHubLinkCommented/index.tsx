import React from "react";

import type { ActivityContentResourceHubLinkCommented } from "@/api";
import type { Activity } from "@/models/activities";
import type { ActivityHandler, FeedItemProps } from "../interfaces";

import { Trans } from "../i18n";
import i18n from "@/i18n";
import { activityAuthorName, commentedLink, linkLink } from "../feedItemLinks";
import { Summary } from "turboui";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import { parseCommentContent } from "@/models/comments";
import { commentedResourcePath, visibleParentDescriptor } from "../resourceHubActivity";

const ResourceHubLinkCommented: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, activity: Activity): string {
    const data = content(activity);
    const resourcePath = data.link?.id ? paths.resourceHubLinkPath(data.link.id) : null;

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
    let link = <React.Fragment />;

    if (data.link) {
      link = linkLink(paths, data.link);
    }

    if (data.link?.id) {
      action = commentedLink(paths.resourceHubLinkPath(data.link.id), data.comment);
    }

    const sentence =
      parent?.page === "project"
        ? i18n.t(
            "{{author}} <action>commented</action> on <resource>{{linkName}}</resource> in the <parent>{{parentName}}</parent> project",
          )
        : parent?.page === "goal"
          ? i18n.t(
              "{{author}} <action>commented</action> on <resource>{{linkName}}</resource> in the <parent>{{parentName}}</parent> goal",
            )
          : parent
            ? i18n.t(
                "{{author}} <action>commented</action> on <resource>{{linkName}}</resource> in the <parent>{{parentName}}</parent> space",
              )
            : i18n.t("{{author}} <action>commented</action> on <resource>{{linkName}}</resource>");
    return (
      <Trans
        defaults={sentence}
        values={{
          author: activityAuthorName(activity),
          linkName: data.link?.name ?? i18n.t("a link"),
          parentName: parent?.name,
        }}
        components={{
          action: typeof action === "string" ? <React.Fragment /> : action,
          resource: link,
          parent: parent?.link ?? <React.Fragment />,
        }}
      />
    );
  },

  FeedItemContent({ activity }: { activity: Activity }) {
    const { mentionedPersonLookup } = useRichEditorHandlers();
    const comment = content(activity).comment;
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
    const data = content(activity);

    return data.link?.name ? i18n.t("Re: {{title}}", { title: data.link.name }) : i18n.t("Re: a link");
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).link?.name || i18n.t("a link");
  },
};

function content(activity: Activity): ActivityContentResourceHubLinkCommented {
  return activity.content as ActivityContentResourceHubLinkCommented;
}

export default ResourceHubLinkCommented;
