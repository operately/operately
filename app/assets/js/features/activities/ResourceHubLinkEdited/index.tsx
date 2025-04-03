import React from "react";
import * as People from "@/models/people";

import type { Activity } from "@/models/activities";
import type { ActivityContentResourceHubLinkEdited } from "@/api";
import type { ActivityHandler } from "../interfaces";
import { Paths } from "@/routes/paths";
import { feedTitle, spaceLink } from "../feedItemLinks";

const ResourceHubLinkEdited: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(activity: Activity) {
    return Paths.resourceHubLinkPath(content(activity).link!.id!);
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
    const space = spaceLink(content(activity).space!);
    const link = content(activity).link!.name!;

    if (page === "space") {
      return feedTitle(activity, "edited a link:", link);
    } else {
      return feedTitle(activity, "edited a link in the", space, "space:", link);
    }
  },

  FeedItemContent({ activity }: { activity: Activity; page: any }) {
    const contentObj = content(activity);
    const link = contentObj.link!;

    return (
      <div>
        <NameEdited currentName={link.name!} previousName={contentObj.previousName!} />
        <UrlEdited currentUrl={link.url!} previousUrl={contentObj.previousUrl!} />
        <TypeEdited currentType={link.type!} previousType={contentObj.previousType!} />
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

  NotificationTitle({ activity }: { activity: Activity }) {
    return People.firstName(activity.author!) + " edited a link: " + content(activity).link!.name!;
  },

  NotificationLocation(_props: { activity: Activity }) {
    return null;
  },
};

function content(activity: Activity): ActivityContentResourceHubLinkEdited {
  return activity.content as ActivityContentResourceHubLinkEdited;
}

export default ResourceHubLinkEdited;

function NameEdited({ previousName, currentName }: { previousName: string; currentName: string }) {
  if (previousName === currentName) return <></>;

  return (
    <div>
      <b>Name: </b>
      <span className="line-through">{previousName}</span> → {currentName}
    </div>
  );
}

function UrlEdited({ previousUrl, currentUrl }: { previousUrl: string; currentUrl: string }) {
  if (previousUrl === currentUrl) return <></>;

  return (
    <div>
      <b>Url: </b>
      <span className="line-through">{previousUrl}</span> → {currentUrl}
    </div>
  );
}

function TypeEdited({ previousType, currentType }: { previousType: string; currentType: string }) {
  if (previousType === currentType) return <></>;

  return (
    <div>
      <b>Type: </b>
      <span className="line-through">{previousType}</span> → {currentType}
    </div>
  );
}
