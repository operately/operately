import { Activity, ActivityContentCompanyAdminRemoved } from "@/api";
import { firstName } from "@/models/people";
import React from "react";
import { Trans } from "../i18n";
import i18n from "@/i18n";
import { activityAuthorName } from "../feedItemLinks";
import { ActivityHandler } from "../interfaces";

const CompanyAdminRemoved: ActivityHandler = {
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
    const person = content(activity).person;

    if (person) {
      return (
        <Trans
          i18nKey="{{author}} has revoked {{personName}}'s admin privileges"
          values={{ author: activityAuthorName(activity), personName: firstName(person) }}
        />
      );
    }

    return (
      <Trans
        i18nKey="{{author}} has revoked a member's admin privileges"
        values={{ author: activityAuthorName(activity) }}
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
    return i18n.t("Revoked your admin privileges");
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).company!.name!;
  },
};

export default CompanyAdminRemoved;

function content(activity: Activity): ActivityContentCompanyAdminRemoved {
  return activity.content as ActivityContentCompanyAdminRemoved;
}
