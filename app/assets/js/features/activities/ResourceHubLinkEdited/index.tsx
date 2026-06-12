import React from "react";

import type { ActivityContentResourceHubLinkEdited } from "@/api";
import type { Activity } from "@/models/activities";
import * as Activities from "@/models/activities";

import { feedTitle } from "../feedItemLinks";
import type { ActivityHandler } from "../interfaces";
import { EditedResourceList } from "../resourceHubEditedResources";
import { resourceHubLocationName, resourceHubParentParts, resourceHubPathOrParent } from "../resourceHubActivity";

const ResourceHubLinkEdited: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, activity: Activity) {
    const data = content(activity);

    if (data.link?.id) {
      return paths.resourceHubLinkPath(data.link.id);
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
    const resources = <EditedResourceList activity={activity} />;
    const parentParts = resourceHubParentParts(page, data);

    if (Activities.getAggregatedActivities(activity).length === 1) {
      const link = data.link?.name ?? "a link";

      if (parentParts.length === 0) {
        return feedTitle(activity, "edited a link:", link);
      }

      return feedTitle(activity, "edited a link", ...parentParts, ":", link);
    }

    if (parentParts.length === 0) {
      return feedTitle(activity, "edited", resources);
    }

    return feedTitle(activity, "edited", resources, ...parentParts);
  },

  FeedItemContent({ activity }: { activity: Activity; page: any }) {
    if (Activities.getAggregatedActivities(activity).length > 1) return null;

    const contentObj = content(activity);
    const link = contentObj.link;

    if (!link) return null;

    return (
      <div>
        <NameEdited currentName={link.name ?? ""} previousName={contentObj.previousName ?? ""} />
        <UrlEdited currentUrl={link.url ?? ""} previousUrl={contentObj.previousUrl ?? ""} />
        <TypeEdited currentType={link.type ?? ""} previousType={contentObj.previousType ?? ""} />
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
    return "Edited a link: " + (content(activity).link?.name ?? "a link");
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return resourceHubLocationName(content(activity));
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
