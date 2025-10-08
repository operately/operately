import React from "react";

import type { Activity, ActivityContentGroupEdited } from "@/api";
import type { ActivityHandler } from "../interfaces";

import { assertPresent } from "@/utils/assertions";
import { feedTitle, spaceLink } from "../feedItemLinks";

const GroupEdited: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, activity: Activity): string {
    const data = content(activity);
    const spaceId = data.space?.id;

    assertPresent(spaceId, "space.id must be present in GroupEdited activity content");

    return paths.spacePath(spaceId);
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

    assertPresent(data.space, "space must be present in GroupEdited activity content");

    if (page === "space") {
      return feedTitle(activity, "updated this space");
    }

    return feedTitle(activity, "updated the", spaceLink(data.space), "space");
  },

  FeedItemContent({ activity }: { activity: Activity }) {
    const data = content(activity);

    const oldName = data.oldName ?? "";
    const newName = data.newName ?? "";
    const oldMission = data.oldMission ?? "";
    const newMission = data.newMission ?? "";

    const nameChanged = oldName !== newName && (oldName !== "" || newName !== "");
    const missionChanged = oldMission !== newMission && (oldMission !== "" || newMission !== "");

    if (!nameChanged && !missionChanged) {
      return null;
    }

    return (
      <div className="flex flex-col gap-1 text-sm">
        {nameChanged && (
          <div>
            <span className="font-semibold">Name:</span> {oldName} → {newName}
          </div>
        )}
        {missionChanged && (
          <div>
            <span className="font-semibold">Purpose:</span> {oldMission} → {newMission}
          </div>
        )}
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
    const data = content(activity);

    const spaceName = data.newName || data.space?.name;

    if (spaceName) {
      return `Updated the ${spaceName} space`;
    }

    return "Updated the space";
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).space?.name ?? null;
  },
};

function content(activity: Activity): ActivityContentGroupEdited {
  return activity.content as ActivityContentGroupEdited;
}

export default GroupEdited;
