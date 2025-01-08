import React from "react";
import * as People from "@/models/people";

import type { Activity } from "@/models/activities";
import type { ActivityContentResourceHubFileCreated } from "@/api";
import type { ActivityHandler } from "../interfaces";
import { Paths } from "@/routes/paths";
import { Link } from "@/components/Link";
import { feedTitle, fileLink, resourceHubLink, spaceLink } from "../feedItemLinks";
import { assertPresent } from "@/utils/assertions";

const ResourceHubFileCreated: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(activity: Activity) {
    const data = content(activity);

    assertPresent(data.files, "files must be present in FileCreated activity");

    if (data.files.length > 1) {
      return Paths.resourceHubPath(data.resourceHub?.id!);
    } else {
      return Paths.resourceHubFilePath(data.files[0]?.id!);
    }
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

    const space = spaceLink(data.space!);
    const resourceHub = resourceHubLink(data.resourceHub!);

    if (data.files?.length === 1) {
      const file = fileLink(data.files[0]!);

      if (page === "space") {
        return feedTitle(activity, "added a file:", file);
      } else {
        return feedTitle(activity, "added a file to", resourceHub, "in the", space, "space:", file);
      }
    } else {
      if (page === "space") {
        return feedTitle(activity, "added some files:");
      } else {
        return feedTitle(activity, "added some files to", resourceHub, "in the", space, "space:");
      }
    }
  },

  FeedItemContent({ activity }: { activity: Activity; page: any }) {
    const data = content(activity);

    if (data.files && data.files.length > 1) {
      return (
        <ul className="list-disc ml-4">
          {data.files.map((file, idx) => {
            const path = Paths.resourceHubFilePath(file.id!);
            const name = file.name!;

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
      return People.firstName(activity.author!) + " added a file: " + data.files[0]?.name;
    } else {
      return People.firstName(activity.author!) + " added some files";
    }
  },

  NotificationLocation(_props: { activity: Activity }) {
    return null;
  },
};

function content(activity: Activity): ActivityContentResourceHubFileCreated {
  return activity.content as ActivityContentResourceHubFileCreated;
}

export default ResourceHubFileCreated;
