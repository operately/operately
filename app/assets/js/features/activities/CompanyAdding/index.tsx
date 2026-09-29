import React from "react";
import { Trans } from "../i18n";
import { activityAuthorName } from "../feedItemLinks";

import type { Activity } from "@/models/activities";
import type { ActivityHandler } from "../interfaces";

const CompanyAdding: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(_paths, _activity: Activity) {
    throw new Error("Not implemented");
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

  FeedItemTitle({ activity }: { activity: Activity }) {
    return <Trans i18nKey="{{author}} created this company" values={{ author: activityAuthorName(activity) }} />;
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
    throw new Error("Not implemented");
  },

  NotificationLocation(_props: { activity: Activity }) {
    return null;
  },
};

export default CompanyAdding;
