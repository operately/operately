import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as PageOptions from "@/components/PaperContainer/PageOptions";
import { DiscussionReactions } from "./DiscussionReactions";
import * as React from "react";

import { Comments } from "./Comments";

import { useReadNotificationsOnLoad } from "@/models/notifications/notificationLifecycle";
import { invalidateProjectInteractionQueries } from "@/models/projects/projectInteractionQueries";
import { Avatar, IconEdit, CurrentSubscriptions, RichContent, FormattedTime } from "turboui";
import { useFormattedTimePreferences } from "@/hooks/useFormattedTimePreferences";

import { useMe } from "../../contexts/CurrentCompanyContext";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import { compareIds, usePaths } from "../../routes/paths";
import { useCurrentSubscriptionsQueryAdapter } from "@/models/subscriptions/useCurrentSubscriptionsQueryAdapter";
import { useLoadedData, useRefresh } from "./loader";

export function Page() {
  const { discussion } = useLoadedData();

  const project = discussion.project;
  useReadNotificationsOnLoad(
    discussion.notifications ?? [],
    project
      ? (client) =>
          invalidateProjectInteractionQueries(
            client,
            {
              projectId: project.id,
              spaceId: discussion.space?.id,
              resourceId: discussion.id,
              resourceType: "project_discussion",
            },
            "none",
          )
      : undefined,
  );

  return (
    <Pages.Page title={[discussion.title || "Discussion", discussion.project?.name || ""]}>
      <Paper.Root>
        <Nav />

        <Paper.Body>
          <Options />
          <Title />
          <Content />
          <DiscussionReactions />
          <Comments />
          <Subscriptions />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Options() {
  const { discussion } = useLoadedData();
  const paths = usePaths();
  const me = useMe();

  return (
    <PageOptions.Root testId="options">
      {discussion.author && me && compareIds(discussion.author.id, me.id) && (
        <PageOptions.Link
          icon={IconEdit}
          title="Edit"
          to={paths.projectDiscussionEditPath(discussion.id)}
          testId="edit"
          keepOutsideOnBigScreen
        />
      )}
    </PageOptions.Root>
  );
}

function Content() {
  const { discussion } = useLoadedData();
  const message = JSON.parse(discussion.message || "{}");
  const { mentionedPersonLookup, resourceLinkTitles } = useRichEditorHandlers({
    resourceLinkContents: message,
  });

  return (
    <div className="my-8">
      <RichContent
        content={message}
        mentionedPersonLookup={mentionedPersonLookup}
        resourceLinkTitles={resourceLinkTitles}
      />
    </div>
  );
}

function Nav() {
  const paths = usePaths();
  const { discussion } = useLoadedData();

  const items: Paper.NavigationItem[] = [];

  if (discussion.space) {
    items.push({ to: paths.spacePath(discussion.space.id), label: discussion.space.name });
    items.push({ to: paths.spaceWorkMapPath(discussion.space.id, "projects"), label: "Work Map" });
  } else {
    items.push({ to: paths.workMapPath("projects"), label: "Work Map" });
  }

  if (discussion.project) {
    items.push({ to: paths.projectPath(discussion.project.id, { tab: "overview" }), label: discussion.project.name });
    items.push({ to: paths.projectPath(discussion.project.id, { tab: "discussions" }), label: "Discussions" });
  }

  return <Paper.Navigation items={items} />;
}

function Title() {
  const { discussion } = useLoadedData();
  const formattedTimePreferences = useFormattedTimePreferences();

  return (
    <div className="flex items-center gap-3">
      {discussion.author && <Avatar person={discussion.author} size={50} />}
      <div>
        <div className="text-content-accent text-2xl font-bold leading-tight">{discussion.title}</div>
        <div className="inline-flex items-center gap-1">
          <span>{discussion.author?.fullName}</span>
          on <FormattedTime {...formattedTimePreferences} time={discussion.insertedAt} format="long-date" />
        </div>
      </div>
    </div>
  );
}

function Subscriptions() {
  const refresh = useRefresh();
  const { discussion, isCurrentUserSubscribed } = useLoadedData();

  const subscriptionsState = useCurrentSubscriptionsQueryAdapter({
    potentialSubscribers: discussion.potentialSubscribers ?? [],
    subscriptionList: discussion.subscriptionList,
    resourceName: "discussion",
    type: "comment_thread",
    onRefresh: refresh,
  });

  if (!discussion.potentialSubscribers || !discussion.subscriptionList) {
    return null;
  }

  return (
    <div className="border-t border-stroke-base mt-16 pt-8">
      <CurrentSubscriptions
        {...subscriptionsState}
        isCurrentUserSubscribed={isCurrentUserSubscribed}
        canEditSubscribers={discussion.projectPermissions?.canEdit || false}
      />
    </div>
  );
}
