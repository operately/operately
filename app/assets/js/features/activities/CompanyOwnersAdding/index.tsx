import React from "react";
import { Trans } from "../i18n";
import i18n from "@/i18n";
import { activityAuthorName, activityPeopleNames } from "../feedItemLinks";

import type { ActivityContentCompanyOwnersAdding } from "@/api";
import type { Activity } from "@/models/activities";

import type { ActivityHandler } from "../interfaces";

const CompanyOwnersAdding: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, _activity: Activity) {
    return paths.companyAdminPath();
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

  FeedItemTitle({ activity }: { activity: Activity; page: any }) {
    const people = content(activity).people!.map((p) => p.person!);
    const names = activityPeopleNames(people);

    return (
      <Trans
        i18nKey="{{author}} promoted {{names}} to account owner"
        values={{ author: activityAuthorName(activity), names }}
      />
    );
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

  NotificationTitle(_activity: { activity: Activity }) {
    return i18n.t("Promoted you to an account owner");
  },

  NotificationLocation(_props: { activity: Activity }) {
    return null;
  },
};

function content(activity: Activity): ActivityContentCompanyOwnersAdding {
  return activity.content as ActivityContentCompanyOwnersAdding;
}

export default CompanyOwnersAdding;
