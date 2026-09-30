import { Activity, ActivityContentCompanyAdminAdded } from "@/api";
import React from "react";
import { Trans } from "../i18n";
import i18n from "@/i18n";
import { activityAuthorName, activityPeopleNames } from "../feedItemLinks";
import { ActivityHandler } from "../interfaces";

const CompanyAdminAdded: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths): string {
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
    const names = activityPeopleNames(content(activity).people ?? []);

    return (
      <Trans
        i18nKey="{{author}} has granted admin privileges to {{names}}"
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

  NotificationTitle(_props: { activity: Activity }) {
    return i18n.t("Granted you admin privileges");
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).company!.name!;
  },
};

export default CompanyAdminAdded;

function content(activity: Activity): ActivityContentCompanyAdminAdded {
  return activity.content as ActivityContentCompanyAdminAdded;
}
