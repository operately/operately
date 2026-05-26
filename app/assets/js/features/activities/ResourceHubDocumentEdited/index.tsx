import type { ActivityContentResourceHubDocumentEdited, ResourceHubDocument } from "@/api";
import type { Activity } from "@/models/activities";
import * as Activities from "@/models/activities";
import * as React from "react";
import { Link } from "turboui";

import { documentLink, feedTitle, spaceLink } from "../feedItemLinks";
import type { ActivityHandler } from "../interfaces";
import { usePaths } from "@/routes/paths";

const ResourceHubDocumentEdited: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, activity: Activity) {
    return paths.resourceHubDocumentPath(content(activity).document!.id!);
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

    const documents = documentsForFeed(activity);
    const document = documents.length > 1 ? <DocumentLinkList documents={documents} /> : documentLink(data.document!);
    const space = spaceLink(data.space!);

    if (page === "space") {
      return feedTitle(activity, "edited", document);
    } else {
      return feedTitle(activity, "edited", document, "in the", space, "space");
    }
  },

  FeedItemContent(_props: { activity: Activity; page: any }) {
    return null;
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
    return "Edited the document";
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).resourceHub!.name!;
  },
};

function content(activity: Activity): ActivityContentResourceHubDocumentEdited {
  return activity.content as ActivityContentResourceHubDocumentEdited;
}

function documentsForFeed(activity: Activity): ResourceHubDocument[] {
  const seen = new Set<string>();

  return Activities.getAggregatedActivities(activity)
    .slice()
    .sort((a, b) => (a.insertedAt || "").localeCompare(b.insertedAt || ""))
    .map((activity) => content(activity).document)
    .filter((document): document is ResourceHubDocument => Boolean(document?.id))
    .filter((document) => {
      if (seen.has(document.id)) return false;

      seen.add(document.id);
      return true;
    });
}

function DocumentLinkList({ documents }: { documents: ResourceHubDocument[] }) {
  const paths = usePaths();

  return (
    <>
      {documents.map((document, index) => (
        <React.Fragment key={document.id}>
          {documentListSeparator(index, documents.length)}
          <Link to={paths.resourceHubDocumentPath(document.id)}>{document.name}</Link>
        </React.Fragment>
      ))}
    </>
  );
}

function documentListSeparator(index: number, count: number) {
  if (index === 0) return "";
  if (index === count - 1) return count === 2 ? " and " : ", and ";

  return ", ";
}

export default ResourceHubDocumentEdited;
