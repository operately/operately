import { ActivityContentCompanyMemberConvertedToGuest } from "@/api";
import React from "react";
import { Trans } from "../i18n";
import i18n from "@/i18n";
import { activityAuthorName, personLink } from "../feedItemLinks";

import type { Activity } from "@/models/activities";
import type { ActivityHandler, FeedItemProps } from "../interfaces";

const CompanyMemberConvertedToGuest: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, _activity: Activity) {
    return paths.homePath();
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

  FeedItemTitle({ activity, paths }: FeedItemProps) {
    const { person } = content(activity);

    if (person) {
      return (
        <Trans
          i18nKey="{{author}} converted <person>{{personName}}</person> to an outside collaborator"
          values={{ author: activityAuthorName(activity), personName: person.fullName }}
          components={{ person: personLink(paths, person) }}
        />
      );
    } else {
      return (
        <Trans
          i18nKey="{{author}} converted a team member to an outside collaborator"
          values={{ author: activityAuthorName(activity) }}
        />
      );
    }
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

  NotificationTitle(_props: { activity: Activity }) {
    return i18n.t("Converted your account to an outside collaborator");
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).company?.name ?? null;
  },
};

function content(activity: Activity): ActivityContentCompanyMemberConvertedToGuest {
  return activity.content as ActivityContentCompanyMemberConvertedToGuest;
}

export default CompanyMemberConvertedToGuest;
