import React from "react";

import type { ActivityContentResourceHubFileCreated } from "@/api";
import type { Activity } from "@/models/activities";

import { usePaths } from "@/routes/paths";
import { assertPresent } from "@/utils/assertions";
import { Link } from "turboui";
import { feedTitle, fileLink, resourceHubLink } from "../feedItemLinks";
import type { ActivityHandler } from "../interfaces";
import { resourceHubParentScope } from "../resourceHubActivityContext";

const ResourceHubFileCreated: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, activity: Activity) {
    const data = content(activity);

    assertPresent(data.files, "files must be present in FileCreated activity");
    assertPresent(data.resourceHub?.id, "resourceHub must be present in FileCreated activity");

    if (data.files.length === 1 && data.files[0]) {
      return paths.resourceHubFilePath(data.files[0].id!);
    } else {
      return paths.resourceHubPath(data.resourceHub.id);
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

    assertPresent(data.files, "files must be present in FileCreated activity");

    const resourceHub = data.resourceHub ? resourceHubLink(data.resourceHub) : "Docs & Files";

    if (data.files.length === 1 && data.files[0]) {
      const file = fileLink(data.files[0]);

      if (page === "space" || page === "project") {
        return feedTitle(activity, "added a file:", file);
      } else {
        return feedTitle(activity, "added a file to", resourceHub, ...resourceHubParentScope(data, page, ":"), file);
      }
    } else {
      if (page === "space" || page === "project") {
        return feedTitle(activity, "added some files:");
      } else {
        return feedTitle(activity, "added some files to", resourceHub, ...resourceHubParentScope(data, page, ":"));
      }
    }
  },

  FeedItemContent({ activity }: { activity: Activity; page: any }) {
    const paths = usePaths();
    const data = content(activity);

    if (data.files && data.files.length > 1) {
      return (
        <ul className="list-disc ml-4">
          {data.files.map((file, idx) => {
            assertPresent(file.id, "id must be present in file");
            assertPresent(file.name, "name must be present in file");

            const path = paths.resourceHubFilePath(file.id);
            const name = file.name;

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
      return "Added a file: " + data.files[0]?.name;
    } else {
      return "Added some files";
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
