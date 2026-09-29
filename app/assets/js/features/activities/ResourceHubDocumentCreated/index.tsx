import type { Paths } from "@/routes/paths";
import React from "react";

import type { ActivityContentResourceHubDocumentCreated } from "@/api";
import type { Activity } from "@/models/activities";
import * as People from "@/models/people";

import { Trans } from "../i18n";
import i18n from "@/i18n";
import { activityAuthorName, documentLink } from "../feedItemLinks";
import type { ActivityHandler, FeedItemProps } from "../interfaces";
import { Summary } from "turboui";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import { resourceHubLocationName, resourceHubPathOrParent, visibleParentDescriptor } from "../resourceHubActivity";

const ResourceHubDocumentCreating: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, activity: Activity): string {
    const data = content(activity);

    if (data.document?.id) {
      return paths.resourceHubDocumentPath(data.document.id);
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
    if (content(activity).copiedDocument) {
      return ItemCopiedTitle(paths, activity, page);
    } else {
      return ItemCreatedTitle(paths, activity, page);
    }
  },

  FeedItemContent({ activity }: { activity: Activity }) {
    const { document } = content(activity);
    const { mentionedPersonLookup } = useRichEditorHandlers({
      scope: People.NoneSearchScope,
    });

    return <Summary content={document?.content} characterCount={160} mentionedPersonLookup={mentionedPersonLookup} />;
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
    const document = content(activity).document;
    const copiedDocument = content(activity).copiedDocument;
    const documentName = document?.name ?? i18n.t("a document");

    if (copiedDocument) {
      return i18n.t("Created a copy of {{originalName}} and named it {{documentName}}", {
        originalName: copiedDocument.name,
        documentName,
      });
    } else {
      return i18n.t("Added: {{documentName}}", { documentName });
    }
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return resourceHubLocationName(content(activity));
  },
};

function content(activity: Activity): ActivityContentResourceHubDocumentCreated {
  return activity.content as ActivityContentResourceHubDocumentCreated;
}

export default ResourceHubDocumentCreating;

function ItemCopiedTitle(paths: Paths, activity: Activity, page: string) {
  const data = content(activity);

  const document = data.document ? documentLink(paths, data.document) : <React.Fragment />;
  const copiedDocument = data.copiedDocument ? documentLink(paths, data.copiedDocument) : <React.Fragment />;
  const parent = visibleParentDescriptor(paths, page, data);

  const sentence =
    parent?.page === "project"
      ? i18n.t(
          "{{author}} created a copy of <original>{{originalName}}</original> and named it <document>{{documentName}}</document> in the <parent>{{parentName}}</parent> project",
        )
      : parent?.page === "goal"
        ? i18n.t(
            "{{author}} created a copy of <original>{{originalName}}</original> and named it <document>{{documentName}}</document> in the <parent>{{parentName}}</parent> goal",
          )
        : parent
          ? i18n.t(
              "{{author}} created a copy of <original>{{originalName}}</original> and named it <document>{{documentName}}</document> in the <parent>{{parentName}}</parent> space",
            )
          : i18n.t(
              "{{author}} created a copy of <original>{{originalName}}</original> and named it <document>{{documentName}}</document>",
            );
  return (
    <Trans
      defaults={sentence}
      values={{
        author: activityAuthorName(activity),
        documentName: data.document?.name ?? i18n.t("a document"),
        originalName: data.copiedDocument?.name ?? i18n.t("a document"),
        parentName: parent?.name,
      }}
      components={{ document, original: copiedDocument, parent: parent?.link ?? <React.Fragment /> }}
    />
  );
}

function ItemCreatedTitle(paths: Paths, activity: Activity, page: string) {
  const data = content(activity);

  const document = data.document ? documentLink(paths, data.document) : <React.Fragment />;
  const parent = visibleParentDescriptor(paths, page, data);

  const sentence =
    parent?.page === "project"
      ? i18n.t(
          "{{author}} created a document in the <parent>{{parentName}}</parent> project: <document>{{documentName}}</document>",
        )
      : parent?.page === "goal"
        ? i18n.t(
            "{{author}} created a document in the <parent>{{parentName}}</parent> goal: <document>{{documentName}}</document>",
          )
        : parent
          ? i18n.t(
              "{{author}} created a document in the <parent>{{parentName}}</parent> space: <document>{{documentName}}</document>",
            )
          : i18n.t("{{author}} created a document: <document>{{documentName}}</document>");
  return (
    <Trans
      defaults={sentence}
      values={{
        author: activityAuthorName(activity),
        documentName: data.document?.name ?? i18n.t("a document"),
        parentName: parent?.name,
      }}
      components={{ document, parent: parent?.link ?? <React.Fragment /> }}
    />
  );
}
