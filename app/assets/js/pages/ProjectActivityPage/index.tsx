import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as Projects from "@/models/projects";
import * as Activities from "@/models/activities";
import * as Reactions from "@/models/reactions";

import { usePaths } from "@/routes/paths";
import { ReactionList, useReactionsForm } from "@/features/Reactions";
import { CommentSection, useComments } from "@/features/CommentSection";

import { Avatar, CurrentSubscriptions } from "turboui";
import FormattedTime from "@/components/FormattedTime";
import ActivityHandler from "@/features/activities";
import { useClearNotificationsOnLoad } from "@/features/notifications";
import { PageModule } from "@/routes/types";
import { useCurrentSubscriptionsAdapter } from "@/models/subscriptions";

import { loader, useLoaderData } from "./loader";

export default { name: "ProjectActivityPage", loader, Page } as PageModule;

function Page() {
  const { activity, project } = useLoaderData();

  useClearNotificationsOnLoad(activity.notifications || []);

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
          <Comments project={project} />

          <Subscriptions />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Nav() {
  const paths = usePaths();
  const { project } = useLoaderData();

  const items: Array<{ to: string; label: string }> = [];

  if (project.space) {
    items.push({ to: paths.spacePath(project.space.id), label: project.space.name });
  }
  items.push({ to: paths.projectPath(project.id), label: project.name });

  return <Paper.Navigation items={items} />;
}

function Title({ activity }: { activity: Activities.Activity }) {
  const author = activity.author;

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
              <FormattedTime time={activity.insertedAt} format="long-date" />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ActivityReactions() {
  const { activity } = useLoaderData();
  const { commentThread, permissions } = activity;

  if (!commentThread?.reactions || !commentThread.id || !permissions) {
    return null;
  }

  const reactions = commentThread.reactions.filter((reaction): reaction is NonNullable<typeof reaction> => !!reaction);
  const entity = Reactions.entity(commentThread.id, "comment_thread");
  const addReactionForm = useReactionsForm(entity, reactions);

  return <ReactionList size={24} form={addReactionForm} canAddReaction={!!permissions.canCommentOnThread} />;
}

function Comments({ project }: { project: Projects.Project }) {
  const { activity } = useLoaderData();
  const { commentThread, permissions } = activity;

  if (!commentThread || !permissions) {
    return null;
  }

  const thread = { ...commentThread, project };
  const commentsForm = useComments({ thread: thread, project: project, parentType: "comment_thread" });

  return (
    <>
      <div className="border-t border-stroke-base mt-8" />
      <CommentSection
        form={commentsForm}
        commentParentType="comment_thread"
        canComment={!!permissions.canCommentOnThread}
      />
    </>
  );
}

function Subscriptions() {
  const refresh = Pages.useRefresh();
  const { activity, project, isCurrentUserSubscribed } = useLoaderData();

  if (!activity.commentThread?.potentialSubscribers || !activity.commentThread?.subscriptionList) {
    return null;
  }

  const subscriptionsState = useCurrentSubscriptionsAdapter({
    potentialSubscribers: activity.commentThread.potentialSubscribers,
    subscriptionList: activity.commentThread.subscriptionList,
    resourceName: "discussion",
    type: "comment_thread",
    onRefresh: refresh,
  });

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
