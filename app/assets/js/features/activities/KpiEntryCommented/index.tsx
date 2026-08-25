import * as React from "react";

import type { ActivityContentKpiEntryCommented } from "@/api";
import type { Activity } from "@/models/activities";
import type { ActivityHandler } from "../interfaces";

import { usePaths } from "@/routes/paths";
import { Link, Summary } from "turboui";
import { commentPath, commentedLink, feedTitle, spaceLink } from "./../feedItemLinks";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import { parseCommentContent } from "@/models/comments";

const KpiEntryCommented: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, activity: Activity): string {
    const { comment, kpi, space } = content(activity);

    if (space?.id && kpi?.id) {
      return commentPath(paths.spaceKpiPath(space.id, kpi.id), comment);
    }

    if (space?.id) return paths.spaceKpisPath(space.id);
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

  FeedItemTitle({ activity, page }: { activity: Activity; page: any }) {
    const paths = usePaths();
    const { comment, space, kpi } = content(activity);

    const kpiPath = space?.id && kpi?.id ? paths.spaceKpiPath(space.id, kpi.id) : space?.id ? paths.spaceKpisPath(space.id) : paths.homePath();
    const action = kpi ? commentedLink(kpiPath, comment) : "commented";
    const kpiLink = kpi ? <Link to={kpiPath}>{kpi.name}</Link> : "a KPI";

    if (page === "space") {
      return feedTitle(activity, action, "on a", kpiLink, "update");
    }

    return feedTitle(activity, action, "on a", kpiLink, "update in the", spaceLink(space), "space");
  },

  FeedItemContent({ activity }: { activity: Activity }) {
    const { mentionedPersonLookup } = useRichEditorHandlers();
    const { comment } = content(activity);

    if (!comment?.content) {
      return null;
    }

    const commentContent = parseCommentContent(comment.content);

    if (!commentContent) {
      return null;
    }

    return <Summary content={commentContent} characterCount={200} mentionedPersonLookup={mentionedPersonLookup} />;
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
    const { kpi } = content(activity);
    const kpiName = kpi?.name ? kpi.name : "a KPI";
    return "Re: " + kpiName;
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).space?.name ?? null;
  },
};

function content(activity: Activity): ActivityContentKpiEntryCommented {
  return activity.content as ActivityContentKpiEntryCommented;
}

export default KpiEntryCommented;
