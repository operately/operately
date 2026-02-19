import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as PageOptions from "@/components/PaperContainer/PageOptions";
import * as Reactions from "@/models/reactions";
import * as React from "react";

import FormattedTime from "@/components/FormattedTime";
import { ProjectPageNavigation } from "@/components/ProjectPageNavigation";
import { Spacer } from "@/components/Spacer";
import { CommentSection, useComments } from "@/features/CommentSection";
import { ReactionList, useReactionsForm } from "@/features/Reactions";
import { useCurrentSubscriptionsAdapter } from "@/models/subscriptions";
import { AvatarWithName, IconEdit, StatusBadge } from "turboui";

import { CurrentSubscriptions, parseContent, RichContent } from "turboui";
import { useMentionedPersonLookupFn } from "@/contexts/CurrentCompanyContext";
import { useClearNotificationsOnLoad } from "@/features/notifications";
import { assertPresent } from "@/utils/assertions";
import { useLoadedData, useRefresh } from "./loader";

import { usePaths } from "@/routes/paths";

export function Page() {
  const { retrospective } = useLoadedData();

  assertPresent(retrospective.notifications, "Retrospective notifications must be defined");
  useClearNotificationsOnLoad(retrospective.notifications);

  return (
    <Pages.Page title={["Retrospective", retrospective.project!.name!]}>
      <Paper.Root size="medium">
        <ProjectPageNavigation project={retrospective.project!} />

        <Paper.Body minHeight="none">
          <Options />

          <Header />
          <Status />
          <RetrospectiveContent />

          <Spacer size={2} />
          <RetroReactions />

          <Spacer size={4} />
          <Comments />

          <Subscriptions />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Options() {
  const paths = usePaths();
  const { retrospective } = useLoadedData();

  return (
    <PageOptions.Root testId="project-options-button">
      {retrospective.permissions?.canEdit && (
        <PageOptions.Link
          icon={IconEdit}
          title="Edit retrospective"
          to={paths.projectRetrospectiveEditPath(retrospective.project!.id!)}
          testId="edit-retrospective"
        />
      )}
    </PageOptions.Root>
  );
}

function Header() {
  const { retrospective } = useLoadedData();

  assertPresent(retrospective.closedAt, "closedAt must be present in retrospective");

  return (
    <>
      <div className="text-center text-content-accent text-3xl font-extrabold">Project Retrospective</div>

      <div className="flex items-center gap-1.5 font-medium justify-center mt-2">
        {retrospective.author && <AvatarWithName person={retrospective.author!} size={20} />}
        {retrospective.author && <span>&middot;</span>}
        <FormattedTime time={retrospective.closedAt} format="long-date" />
      </div>
    </>
  );
}

function Status() {
  const { retrospective } = useLoadedData();

  assertPresent(retrospective.project, "project must be present in retrospective");

  return (
    <div className="mt-4">
      <StatusBadge status={retrospective.project.successStatus} />
    </div>
  );
}

function RetrospectiveContent() {
  const { retrospective } = useLoadedData();

  const content = React.useMemo(() => parseContent(retrospective.content), [retrospective.content]);
  const mentionedPersonLookup = useMentionedPersonLookupFn();

  return (
    <div className="my-8">
      <RichContent content={content} mentionedPersonLookup={mentionedPersonLookup} />
    </div>
  );
}

function RetroReactions() {
  const { retrospective } = useLoadedData();
  const reactions = retrospective.reactions!.map((r) => r!);
  const entity = Reactions.entity(retrospective.id!, "project_retrospective");
  const addReactionForm = useReactionsForm(entity, reactions);

  assertPresent(retrospective.permissions?.canCommentOnRetrospective, "permissions must be present in retrospective");

  return (
    <ReactionList
      size={24}
      form={addReactionForm}
      canAddReaction={retrospective.permissions.canCommentOnRetrospective}
    />
  );
}

function Comments() {
  const { retrospective } = useLoadedData();
  const commentsForm = useComments({ retrospective: retrospective, parentType: "project_retrospective" });

  assertPresent(retrospective.permissions?.canCommentOnRetrospective, "permissions must be present in retrospective");

  return (
    <>
      <div className="border-t border-stroke-base mt-8" />
      <CommentSection
        form={commentsForm}
        commentParentType="project_retrospective"
        canComment={retrospective.permissions.canCommentOnRetrospective}
      />
    </>
  );
}

function Subscriptions() {
  const { retrospective, isCurrentUserSubscribed } = useLoadedData();
  const refresh = useRefresh();

  if (!retrospective.potentialSubscribers || !retrospective.subscriptionList) {
    return null;
  }

  const subscriptionsState = useCurrentSubscriptionsAdapter({
    potentialSubscribers: retrospective.potentialSubscribers,
    subscriptionList: retrospective.subscriptionList,
    resourceName: "project retrospective",
    type: "project_retrospective",
    onRefresh: refresh,
  });

  return (
    <>
      <div className="border-t border-stroke-base mt-16 mb-8" />

      <CurrentSubscriptions
        {...subscriptionsState}
        isCurrentUserSubscribed={isCurrentUserSubscribed}
        canEditSubscribers={retrospective.permissions?.canEdit || false}
      />
    </>
  );
}
