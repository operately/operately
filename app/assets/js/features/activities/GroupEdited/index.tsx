import React from "react";

import type { Activity, ActivityContentGroupEdited } from "@/api";
import type { ActivityHandler, FeedItemProps } from "../interfaces";

import { assertPresent } from "@/utils/assertions";
import { Trans } from "../i18n";
import i18n from "@/i18n";
import { activityAuthorName, spaceLink } from "../feedItemLinks";

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

  FeedItemTitle({ activity, page, paths }: FeedItemProps) {
    const data = content(activity);

    assertPresent(data.space, "space must be present in GroupEdited activity content");

    if (page === "space") {
      return <Trans i18nKey="{{author}} updated this space" values={{ author: activityAuthorName(activity) }} />;
    }

    return (
      <Trans
        i18nKey="{{author}} updated the <space>{{spaceName}}</space> space"
        values={{ author: activityAuthorName(activity), spaceName: data.space.name }}
        components={{ space: spaceLink(paths, data.space) }}
      />
    );
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
            <Trans
              i18nKey="<label>Name:</label> {{oldName}} → {{newName}}"
              values={{ oldName, newName }}
              components={{ label: <span className="font-semibold" /> }}
            />
          </div>
        )}
        {missionChanged && (
          <div>
            <Trans
              i18nKey="<label>Purpose:</label> {{oldMission}} → {{newMission}}"
              values={{ oldMission, newMission }}
              components={{ label: <span className="font-semibold" /> }}
            />
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
      return i18n.t("Updated the {{spaceName}} space", { spaceName });
    }

    return i18n.t("Updated the space");
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).space?.name ?? null;
  },
};

function content(activity: Activity): ActivityContentGroupEdited {
  return activity.content as ActivityContentGroupEdited;
}

export default GroupEdited;
