import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as Activities from "@/models/activities";
import { ActivityReactions } from "./ActivityReactions";

import { usePaths } from "@/routes/paths";
import { Comments } from "./Comments";

import { Avatar, CurrentSubscriptions, FormattedTime } from "turboui";
import { useFormattedTimePreferences } from "@/hooks/useFormattedTimePreferences";
import ActivityHandler from "@/features/activities";
import { useReadNotificationsOnLoad } from "@/models/notifications/notificationLifecycle";
import { invalidateProjectInteractionQueries } from "@/models/projects/projectInteractionQueries";
import { PageModule } from "@/routes/types";
import { useCurrentSubscriptionsQueryAdapter } from "@/models/subscriptions/useCurrentSubscriptionsQueryAdapter";

import { loader, useLoadedData, useRefresh } from "./loader";

export default { name: "ProjectActivityPage", loader, Page } as PageModule;

function Page() {
  const { activity, project } = useLoadedData();

  const thread = activity.commentThread;
  useReadNotificationsOnLoad(
    activity.notifications ?? [],
    thread
      ? (client) =>
          invalidateProjectInteractionQueries(
            client,
            {
              projectId: project.id,
              spaceId: project.space?.id,
              resourceId: thread.id,
              resourceType: "project_discussion",
              activityId: activity.id,
            },
            "none",
          )
      : undefined,
  );

  return (
    <Pages.Page title={[ActivityHandler.pageHtmlTitle(activity), project.name]}>
      <Paper.Root>
        <Nav />

        <Paper.Body>
          <ActivityHandler.PageOptions activity={activity} />
          <Title activity={activity} />
          <div className="my-8">
            <ActivityHandler.PageContent activity={activity} />
          </div>

          <ActivityReactions />
          <Comments />

          <Subscriptions />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Nav() {
  const paths = usePaths();
  const { project } = useLoadedData();

  const items: Array<{ to: string; label: string }> = [];

  if (project.space) {
    items.push({ to: paths.spacePath(project.space.id), label: project.space.name });
  }
  items.push({ to: paths.projectPath(project.id), label: project.name });

  return <Paper.Navigation items={items} />;
}

function Title({ activity }: { activity: Activities.Activity }) {
  const author = activity.author;
  const formattedTimePreferences = useFormattedTimePreferences();

  if (!author) {
    return null;
  }

  return (
    <div className="flex items-center gap-3">
      <Avatar person={author} size={50} />
      <div>
        <div className="text-content-accent text-2xl font-bold leading-tight">
          <ActivityHandler.PageTitle activity={activity} />
        </div>
        <div className="inline-flex items-center gap-1">
          <span>{author.fullName}</span>
          {activity.insertedAt && (
            <>
              <span>on</span>
              <FormattedTime {...formattedTimePreferences} time={activity.insertedAt} format="long-date" />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Subscriptions() {
  const refresh = useRefresh();
  const { activity, project, isCurrentUserSubscribed } = useLoadedData();

  const subscriptionsState = useCurrentSubscriptionsQueryAdapter({
    potentialSubscribers: activity.commentThread?.potentialSubscribers ?? [],
    subscriptionList: activity.commentThread?.subscriptionList,
    resourceName: "discussion",
    type: "comment_thread",
    onRefresh: refresh,
  });

  if (!activity.commentThread?.potentialSubscribers || !activity.commentThread?.subscriptionList) {
    return null;
  }

  return (
    <div className="border-t border-stroke-base mt-16 pt-8">
      <CurrentSubscriptions
        {...subscriptionsState}
        isCurrentUserSubscribed={isCurrentUserSubscribed}
        canEditSubscribers={project.permissions?.canEdit || false}
      />
    </div>
  );
}
