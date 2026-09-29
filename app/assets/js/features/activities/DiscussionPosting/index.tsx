import * as React from "react";

import type { ActivityContentDiscussionPosting } from "@/api";
import type { Activity } from "@/models/activities";
import type { ActivityHandler, FeedItemProps } from "../interfaces";

import { Link, Summary } from "turboui";
import { Trans } from "../i18n";
import i18n from "@/i18n";
import { activityAuthorName, spaceLink } from "./../feedItemLinks";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";

const DiscussionPosting: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, _activity: Activity): string {
    return paths.discussionPath(content(_activity).discussion!.id!);
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
    const discussion = content(activity).discussion!;

    const path = paths.discussionPath(discussion.id!);
    const link = <Link to={path}>{discussion.title!}</Link>;

    if (page === "space") {
      return (
        <Trans
          i18nKey="{{author}} posted <discussion>{{title}}</discussion>"
          values={{ author: activityAuthorName(activity), title: discussion.title }}
          components={{ discussion: link }}
        />
      );
    } else {
      const space = content(activity).space;
      return (
        <Trans
          i18nKey="{{author}} posted <discussion>{{title}}</discussion> in the <space>{{spaceName}}</space>"
          values={{ author: activityAuthorName(activity), title: discussion.title, spaceName: space?.name }}
          components={{ discussion: link, space: space ? spaceLink(paths, space) : <span /> }}
        />
      );
    }
  },

  FeedItemContent({ activity }: { activity: Activity }) {
    const { discussion } = content(activity);
    const { mentionedPersonLookup } = useRichEditorHandlers();

    return <Summary content={discussion?.body} characterCount={200} mentionedPersonLookup={mentionedPersonLookup} />;
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
    return i18n.t("Posted: {{title}}", { title: content(activity).discussion?.title });
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).space!.name!;
  },
};

function content(activity: Activity): ActivityContentDiscussionPosting {
  return activity.content as ActivityContentDiscussionPosting;
}

export default DiscussionPosting;
