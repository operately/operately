import React from "react";

import type { ActivityContentResourceHubFileCreated } from "@/api";
import type { Activity } from "@/models/activities";

import { Link } from "turboui";
import { Trans } from "../i18n";
import i18n from "@/i18n";
import { activityAuthorName, fileLink, resourceHubLink } from "../feedItemLinks";
import type { ActivityHandler, FeedItemProps } from "../interfaces";
import { resourceHubLocationName, resourceHubPathOrParent, visibleParentDescriptor } from "../resourceHubActivity";

const ResourceHubFileCreated: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, activity: Activity) {
    const data = content(activity);

    if (data.files?.length === 1 && data.files[0]?.id) {
      return paths.resourceHubFilePath(data.files[0].id);
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
    const parent = visibleParentDescriptor(paths, page, data);
    const resourceHub = data.resourceHub
      ? resourceHubLink(paths, data.resourceHub, { project: data.project, goal: data.goal })
      : null;
    const files = data.files ?? [];
    const values = {
      author: activityAuthorName(activity),
      fileName: files[0]?.name ?? i18n.t("a file"),
      hubName: data.resourceHub?.name,
      parentName: parent?.name,
    };
    const components = {
      file: files[0]?.id ? fileLink(paths, files[0]) : <React.Fragment />,
      hub: resourceHub ?? <React.Fragment />,
      parent: parent?.link ?? <React.Fragment />,
    };

    if (files.length === 1 && files[0]) {
      if (!parent) {
        return (
          <Trans i18nKey="{{author}} added a file: <file>{{fileName}}</file>" values={values} components={components} />
        );
      }

      if (resourceHub) {
        const sentence =
          parent.page === "project"
            ? i18n.t(
                "{{author}} added a file to <hub>{{hubName}}</hub> in the <parent>{{parentName}}</parent> project: <file>{{fileName}}</file>",
              )
            : parent.page === "goal"
              ? i18n.t(
                  "{{author}} added a file to <hub>{{hubName}}</hub> in the <parent>{{parentName}}</parent> goal: <file>{{fileName}}</file>",
                )
              : i18n.t(
                  "{{author}} added a file to <hub>{{hubName}}</hub> in the <parent>{{parentName}}</parent> space: <file>{{fileName}}</file>",
                );
        return <Trans defaults={sentence} values={values} components={components} />;
      }

      const sentence =
        parent.page === "project"
          ? i18n.t("{{author}} added a file in the <parent>{{parentName}}</parent> project: <file>{{fileName}}</file>")
          : parent.page === "goal"
            ? i18n.t("{{author}} added a file in the <parent>{{parentName}}</parent> goal: <file>{{fileName}}</file>")
            : i18n.t("{{author}} added a file in the <parent>{{parentName}}</parent> space: <file>{{fileName}}</file>");
      return <Trans defaults={sentence} values={values} components={components} />;
    }

    if (!parent) {
      return <Trans i18nKey="{{author}} added files:" values={values} />;
    }

    if (resourceHub) {
      const sentence =
        parent.page === "project"
          ? i18n.t("{{author}} added files to <hub>{{hubName}}</hub> in the <parent>{{parentName}}</parent> project:")
          : parent.page === "goal"
            ? i18n.t("{{author}} added files to <hub>{{hubName}}</hub> in the <parent>{{parentName}}</parent> goal:")
            : i18n.t("{{author}} added files to <hub>{{hubName}}</hub> in the <parent>{{parentName}}</parent> space:");
      return <Trans defaults={sentence} values={values} components={components} />;
    }

    const sentence =
      parent.page === "project"
        ? i18n.t("{{author}} added files in the <parent>{{parentName}}</parent> project:")
        : parent.page === "goal"
          ? i18n.t("{{author}} added files in the <parent>{{parentName}}</parent> goal:")
          : i18n.t("{{author}} added files in the <parent>{{parentName}}</parent> space:");
    return <Trans defaults={sentence} values={values} components={components} />;
  },

  FeedItemContent({ activity, paths }: FeedItemProps) {
    const data = content(activity);

    if (data.files && data.files.length > 1) {
      return (
        <ul className="list-disc ml-4">
          {data.files.map((file, idx) => {
            const name = file.name ?? i18n.t("a file");

            if (!file.id) {
              return <li key={idx}>{name}</li>;
            }

            const path = paths.resourceHubFilePath(file.id);

            return (
              <li key={idx}>
                <Link to={path}>{name}</Link>
              </li>
            );
          })}
        </ul>
      );
    }

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
    const data = content(activity);

    if (data.files?.length === 1) {
      const name = data.files[0]?.name;
      return name == null ? i18n.t("Added a file") : i18n.t("Added a file: {{fileName}}", { fileName: name });
    } else {
      return i18n.t("Added files");
    }
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return resourceHubLocationName(content(activity));
  },
};

function content(activity: Activity): ActivityContentResourceHubFileCreated {
  return activity.content as ActivityContentResourceHubFileCreated;
}

export default ResourceHubFileCreated;
