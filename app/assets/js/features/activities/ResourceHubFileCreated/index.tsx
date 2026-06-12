import React from "react";

import type { ActivityContentResourceHubFileCreated } from "@/api";
import type { Activity } from "@/models/activities";

import { usePaths } from "@/routes/paths";
import { Link } from "turboui";
import { feedTitle, fileLink, resourceHubLink } from "../feedItemLinks";
import type { ActivityHandler } from "../interfaces";
import { resourceHubLocationName, resourceHubParentParts, resourceHubPathOrParent } from "../resourceHubActivity";

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

  FeedItemTitle({ activity, page }: { activity: Activity; page: any }) {
    const data = content(activity);
    const parentParts = resourceHubParentParts(page, data);
    const resourceHub = data.resourceHub ? resourceHubLink(data.resourceHub) : null;
    const files = data.files ?? [];

    if (files.length === 1 && files[0]) {
      const file = files[0].id ? fileLink(files[0]) : files[0].name ?? "a file";

      if (parentParts.length === 0) {
        return feedTitle(activity, "added a file:", file);
      }

      if (resourceHub) {
        return feedTitle(activity, "added a file to", resourceHub, ...parentParts, ":", file);
      }

      return feedTitle(activity, "added a file", ...parentParts, ":", file);
    }

    if (parentParts.length === 0) {
      return feedTitle(activity, "added files:");
    }

    if (resourceHub) {
      return feedTitle(activity, "added files to", resourceHub, ...parentParts, ":");
    }

    return feedTitle(activity, "added files", ...parentParts, ":");
  },

  FeedItemContent({ activity }: { activity: Activity; page: any }) {
    const paths = usePaths();
    const data = content(activity);

    if (data.files && data.files.length > 1) {
      return (
        <ul className="list-disc ml-4">
          {data.files.map((file, idx) => {
            const name = file.name ?? "a file";

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
      return "Added a file: " + (data.files[0]?.name ?? "a file");
    } else {
      return "Added files";
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
