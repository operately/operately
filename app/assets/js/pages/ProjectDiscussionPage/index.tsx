import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as PageOptions from "@/components/PaperContainer/PageOptions";
import * as Projects from "@/models/projects";
import * as Reactions from "@/models/reactions";
import * as React from "react";

import { CommentSection, useComments } from "@/features/CommentSection";
import { ReactionList, useReactionsForm } from "@/features/Reactions";

import { useClearNotificationsOnLoad } from "@/features/notifications";
import { CurrentSubscriptions } from "@/features/Subscriptions";
import { PageModule } from "@/routes/types";
import { assertPresent } from "@/utils/assertions";
import { Avatar, IconEdit } from "turboui";

import Api from "@/api";
import FormattedTime from "@/components/FormattedTime";
import { RichContent } from "turboui";
import { useMe, useMentionedPersonLookupFn } from "../../contexts/CurrentCompanyContext";
import { usePaths } from "../../routes/paths";

export default { name: "ProjectDiscussionPage", loader, Page } as PageModule;

interface LoaderResult {
  discussion: Projects.Discussion;
}

async function loader({ params }): Promise<LoaderResult> {
  return {
    discussion: await Api.project_discussions
      .get({
        id: params.id,
        includeUnreadNotifications: true,
        includePermissions: true,
        includeSubscriptionsList: true,
        includePotentialSubscribers: true,
        includeProject: true,
        includeSpace: true,
      })
      .then((data) => data.discussion),
  };
}

function Page() {
  const { discussion } = Pages.useLoadedData<LoaderResult>();

  assertPresent(discussion.notifications, "Discussion notifications must be defined");
  useClearNotificationsOnLoad(discussion.notifications);

  return (
    <Pages.Page title={[discussion.title!, discussion.project!.name!]}>
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
  const { discussion } = Pages.useLoadedData<LoaderResult>();
  const paths = usePaths();
  const me = useMe();

  return (
    <PageOptions.Root testId="options">
      {discussion.author!.id! === me!.id && (
        <PageOptions.Link
          icon={IconEdit}
          title="Edit"
          to={paths.projectDiscussionEditPath(discussion.id!)}
          testId="edit"
        />
      )}
    </PageOptions.Root>
  );
}

function Content() {
  const { discussion } = Pages.useLoadedData<LoaderResult>();
  const peopleLookup = useMentionedPersonLookupFn();

  return (
    <div className="my-8">
      <RichContent content={JSON.parse(discussion!.message!)} mentionedPersonLookup={peopleLookup} />
    </div>
  );
}

function Nav() {
  const paths = usePaths();
  const { discussion } = Pages.useLoadedData<LoaderResult>();

  return (
    <Paper.Navigation
      items={[
        { to: paths.spacePath(discussion.space!.id!), label: discussion.space!.name! },
        { to: paths.projectPath(discussion.project!.id!), label: discussion.project!.name! },
      ]}
    />
  );
}

function Title() {
  const { discussion } = Pages.useLoadedData<LoaderResult>();

  return (
    <div className="flex items-center gap-3">
      <Avatar person={discussion.author!} size={50} />
      <div>
        <div className="text-content-accent text-2xl font-bold leading-tight">{discussion.title!}</div>
        <div className="inline-flex items-center gap-1">
          <span>{discussion.author!.fullName!}</span>
          on <FormattedTime time={discussion.insertedAt!} format="long-date" />
        </div>
      </div>
    </div>
  );
}

function DiscussionReactions() {
  const { discussion } = Pages.useLoadedData<LoaderResult>();

  assertPresent(discussion.reactions, "discussion.reactions must be present");
  assertPresent(discussion.canComment, "discussion.canComment must be present");

  const reactions = discussion.reactions.map((r) => r!);
  const entity = Reactions.entity(discussion.id!, "comment_thread");
  const addReactionForm = useReactionsForm(entity, reactions);

  return <ReactionList size={24} form={addReactionForm} canAddReaction={discussion.canComment} />;
}

function Comments() {
  const { discussion } = Pages.useLoadedData<LoaderResult>();

  assertPresent(discussion.canComment, "discussion.canComment must be present");
  const commentsForm = useComments({ thread: discussion, parentType: "comment_thread", project: discussion.project! });

  return (
    <>
      <div className="border-t border-stroke-base mt-8" />
      <CommentSection form={commentsForm} commentParentType="comment_thread" canComment={discussion.canComment!} />
    </>
  );
}

function Subscriptions() {
  const refresh = Pages.useRefresh();
  const { discussion } = Pages.useLoadedData<LoaderResult>();

  assertPresent(discussion.subscriptionList, "subscriptionList must be present in commentThread");
  assertPresent(discussion.potentialSubscribers, "potentialSubscribers must be present in commentThread");

  return (
    <div className="border-t border-stroke-base mt-16 pt-8">
      <CurrentSubscriptions
        subscriptionList={discussion.subscriptionList}
        potentialSubscribers={discussion.potentialSubscribers}
        name="discussion"
        type="comment_thread"
        callback={refresh}
      />
    </div>
  );
}
