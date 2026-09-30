import React from "react";

import type { ActivityContentResourceHubLinkEdited } from "@/api";
import type { Activity } from "@/models/activities";
import * as Activities from "@/models/activities";

import { Trans } from "../i18n";
import i18n from "@/i18n";
import { activityAuthorName } from "../feedItemLinks";
import type { ActivityHandler, FeedItemProps } from "../interfaces";
import { EditedResourceList } from "../resourceHubEditedResources";
import { resourceHubLocationName, resourceHubPathOrParent, visibleParentDescriptor } from "../resourceHubActivity";

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

  FeedItemTitle({ activity, page, paths }: FeedItemProps) {
    const data = content(activity);
    const resources = <EditedResourceList activity={activity} paths={paths} />;
    const parent = visibleParentDescriptor(paths, page, data);

    if (Activities.getAggregatedActivities(activity).length === 1) {
      const sentence =
        parent?.page === "project"
          ? i18n.t("{{author}} edited a link in the <parent>{{parentName}}</parent> project: {{linkName}}")
          : parent?.page === "goal"
            ? i18n.t("{{author}} edited a link in the <parent>{{parentName}}</parent> goal: {{linkName}}")
            : parent
              ? i18n.t("{{author}} edited a link in the <parent>{{parentName}}</parent> space: {{linkName}}")
              : i18n.t("{{author}} edited a link: {{linkName}}");
      return (
        <Trans
          defaults={sentence}
          values={{
            author: activityAuthorName(activity),
            linkName: data.link?.name ?? i18n.t("a link"),
            parentName: parent?.name,
          }}
          components={{ parent: parent?.link ?? <React.Fragment /> }}
        />
      );
    }

    const sentence =
      parent?.page === "project"
        ? i18n.t("{{author}} edited <resources/> in the <parent>{{parentName}}</parent> project")
        : parent?.page === "goal"
          ? i18n.t("{{author}} edited <resources/> in the <parent>{{parentName}}</parent> goal")
          : parent
            ? i18n.t("{{author}} edited <resources/> in the <parent>{{parentName}}</parent> space")
            : i18n.t("{{author}} edited <resources/>");
    return (
      <Trans
        defaults={sentence}
        values={{ author: activityAuthorName(activity), parentName: parent?.name }}
        components={{ resources, parent: parent?.link ?? <React.Fragment /> }}
      />
    );
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
    const name = content(activity).link?.name;
    return name == null ? i18n.t("Edited a link") : i18n.t("Edited a link: {{linkName}}", { linkName: name });
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
      <b>{i18n.t("Name:")} </b>
      <span className="line-through">{previousName}</span> → {currentName}
    </div>
  );
}

function UrlEdited({ previousUrl, currentUrl }: { previousUrl: string; currentUrl: string }) {
  if (previousUrl === currentUrl) return <></>;

  return (
    <div>
      <b>{i18n.t("Url:")} </b>
      <span className="line-through">{previousUrl}</span> → {currentUrl}
    </div>
  );
}

function TypeEdited({ previousType, currentType }: { previousType: string; currentType: string }) {
  if (previousType === currentType) return <></>;

  return (
    <div>
      <b>{i18n.t("Type:")} </b>
      <span className="line-through">{previousType}</span> → {currentType}
    </div>
  );
}
