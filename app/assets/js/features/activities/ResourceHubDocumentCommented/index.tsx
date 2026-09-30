import React from "react";
import * as People from "@/models/people";

import type { ActivityContentResourceHubDocumentCommented } from "@/api";
import type { Activity } from "@/models/activities";
import type { ActivityHandler, FeedItemProps } from "../interfaces";

import { Trans } from "../i18n";
import i18n from "@/i18n";
import { activityAuthorName, commentedLink, documentLink } from "../feedItemLinks";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import { Summary } from "turboui";
import { parseCommentContent } from "@/models/comments";
import { commentedResourcePath, visibleParentDescriptor } from "../resourceHubActivity";

const ResourceHubDocumentCommented: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, activity: Activity): string {
    const data = content(activity);
    const resourcePath = data.document?.id ? paths.resourceHubDocumentPath(data.document.id) : null;

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
    let document = <React.Fragment />;

    if (data.document) {
      document = documentLink(paths, data.document);
    }

    if (data.document?.id) {
      action = commentedLink(paths.resourceHubDocumentPath(data.document.id), data.comment);
    }

    const sentence =
      parent?.page === "project"
        ? i18n.t(
            "{{author}} <action>commented</action> on <document>{{documentName}}</document> in the <parent>{{parentName}}</parent> project",
          )
        : parent?.page === "goal"
          ? i18n.t(
              "{{author}} <action>commented</action> on <document>{{documentName}}</document> in the <parent>{{parentName}}</parent> goal",
            )
          : parent
            ? i18n.t(
                "{{author}} <action>commented</action> on <document>{{documentName}}</document> in the <parent>{{parentName}}</parent> space",
              )
            : i18n.t("{{author}} <action>commented</action> on <document>{{documentName}}</document>");
    return (
      <Trans
        defaults={sentence}
        values={{
          author: activityAuthorName(activity),
          documentName: data.document?.name ?? i18n.t("a document"),
          parentName: parent?.name,
        }}
        components={{
          action: typeof action === "string" ? <React.Fragment /> : action,
          document,
          parent: parent?.link ?? <React.Fragment />,
        }}
      />
    );
  },

  FeedItemContent({ activity }: { activity: Activity }) {
    const { comment } = content(activity);
    const commentContent = parseCommentContent(comment?.content);
    const { mentionedPersonLookup } = useRichEditorHandlers({
      scope: People.NoneSearchScope,
    });

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
    const title = content(activity).document?.name;
    return title ? i18n.t("Re: {{title}}", { title }) : i18n.t("Re: a document");
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).document?.name || i18n.t("a document");
  },
};

function content(activity: Activity): ActivityContentResourceHubDocumentCommented {
  return activity.content as ActivityContentResourceHubDocumentCommented;
}

export default ResourceHubDocumentCommented;
