import type { ActivityContentResourceHubLinkCreated } from "@/api";
import type { Activity } from "@/models/activities";

import React from "react";
import { Trans } from "../i18n";
import i18n from "@/i18n";
import { activityAuthorName, linkLink, resourceHubLink } from "../feedItemLinks";
import type { ActivityHandler, FeedItemProps } from "../interfaces";
import { resourceHubLocationName, resourceHubPathOrParent, visibleParentDescriptor } from "../resourceHubActivity";

const ResourceHubLinkCreated: ActivityHandler = {
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
    const link = data.link ? linkLink(paths, data.link) : <React.Fragment />;
    const resourceHub = data.resourceHub
      ? resourceHubLink(paths, data.resourceHub, { project: data.project, goal: data.goal })
      : null;
    const parent = visibleParentDescriptor(paths, page, data);
    const values = {
      author: activityAuthorName(activity),
      linkName: data.link?.name ?? i18n.t("a link"),
      hubName: data.resourceHub?.name,
      parentName: parent?.name,
    };
    const components = {
      resource: link,
      hub: resourceHub ?? <React.Fragment />,
      parent: parent?.link ?? <React.Fragment />,
    };

    if (!parent) {
      return (
        <Trans
          i18nKey="{{author}} added a link: <resource>{{linkName}}</resource>"
          values={values}
          components={components}
        />
      );
    }

    if (resourceHub) {
      const sentence =
        parent.page === "project"
          ? i18n.t(
              "{{author}} added a link to <hub>{{hubName}}</hub> in the <parent>{{parentName}}</parent> project: <resource>{{linkName}}</resource>",
            )
          : parent.page === "goal"
            ? i18n.t(
                "{{author}} added a link to <hub>{{hubName}}</hub> in the <parent>{{parentName}}</parent> goal: <resource>{{linkName}}</resource>",
              )
            : i18n.t(
                "{{author}} added a link to <hub>{{hubName}}</hub> in the <parent>{{parentName}}</parent> space: <resource>{{linkName}}</resource>",
              );
      return <Trans defaults={sentence} values={values} components={components} />;
    }

    const sentence =
      parent.page === "project"
        ? i18n.t(
            "{{author}} added a link in the <parent>{{parentName}}</parent> project: <resource>{{linkName}}</resource>",
          )
        : parent.page === "goal"
          ? i18n.t(
              "{{author}} added a link in the <parent>{{parentName}}</parent> goal: <resource>{{linkName}}</resource>",
            )
          : i18n.t(
              "{{author}} added a link in the <parent>{{parentName}}</parent> space: <resource>{{linkName}}</resource>",
            );
    return <Trans defaults={sentence} values={values} components={components} />;
  },

  FeedItemContent(_props: { activity: Activity; page: any }) {
    return null;
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
    const name = content(activity).link?.name;
    return name == null ? i18n.t("Added a link") : i18n.t("Added a link: {{linkName}}", { linkName: name });
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return resourceHubLocationName(content(activity));
  },
};

function content(activity: Activity): ActivityContentResourceHubLinkCreated {
  return activity.content as ActivityContentResourceHubLinkCreated;
}

export default ResourceHubLinkCreated;
