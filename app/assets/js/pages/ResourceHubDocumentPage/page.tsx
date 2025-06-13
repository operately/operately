import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Reactions from "@/models/reactions";
import { usePublishResourceHubDocument } from "@/models/resourceHubs";

import RichContent from "@/components/RichContent";
import { Spacer } from "@/components/Spacer";
import { CommentSection, useComments } from "@/features/CommentSection";
import { DocumentTitle } from "@/features/documents/DocumentTitle";
import { OngoingDraftActions } from "@/features/drafts";
import { useClearNotificationsOnLoad } from "@/features/notifications";
import { ReactionList, useReactionsForm } from "@/features/Reactions";
import { CopyDocumentModal, ResourcePageNavigation } from "@/features/ResourceHub";
import { CurrentSubscriptions } from "@/features/Subscriptions";
import { useBoolState } from "@/hooks/useBoolState";
import { DeprecatedPaths } from "@/routes/paths";
import { assertPresent } from "@/utils/assertions";

import { useLoadedData } from "./loader";
import { Options } from "./Options";

export function Page() {
  const { document, folder, resourceHub } = useLoadedData();
  const [isCopyFormOpen, _, openCopyForm, closeCopyForm] = useBoolState(false);

  assertPresent(document.notifications, "notifications must be present in document");
  useClearNotificationsOnLoad(document.notifications);

  React.useEffect(closeCopyForm, [document.id]);

  return (
    <Pages.Page title={document.name!}>
      <Paper.Root size="large">
        <ResourcePageNavigation resource={document} />

        <Paper.Body minHeight="600px" className="lg:px-28">
          <Options showCopyModal={openCopyForm} />

          <ContinueEditingDraft />

          <Title />
          <Body />
          <DocumentReactions />
          <DocumentComments />
          <DocumentSubscriptions />

          <CopyDocumentModal
            parent={folder ?? resourceHub}
            resource={document}
            isOpen={isCopyFormOpen}
            hideModal={closeCopyForm}
          />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Title() {
  const { document } = useLoadedData();

  assertPresent(document.author, "author must be present in document");

  return (
    <DocumentTitle
      title={document.name!}
      author={document.author}
      publishedAt={document.insertedAt!}
      state="published"
    />
  );
}

function Body() {
  const { document } = useLoadedData();

  return (
    <>
      <Spacer size={4} />
      <RichContent jsonContent={document.content!} className="text-md sm:text-lg" />
    </>
  );
}

function DocumentReactions() {
  const { document } = useLoadedData();

  assertPresent(document.permissions?.canCommentOnDocument, "permissions must be present in document");

  const reactions = document.reactions!.map((r) => r!);
  const entity = Reactions.entity(document.id!, "resource_hub_document");
  const addReactionForm = useReactionsForm(entity, reactions);

  return (
    <>
      <Spacer size={2} />
      <ReactionList size={24} form={addReactionForm} canAddReaction={document.permissions.canCommentOnDocument} />
    </>
  );
}

function DocumentComments() {
  const { document } = useLoadedData();
  const commentsForm = useComments({ parentType: "resource_hub_document", document: document });

  assertPresent(document.permissions?.canCommentOnDocument, "permissions must be present in document");

  return (
    <>
      <Spacer size={4} />
      <div className="border-t border-stroke-base mt-8" />
      <CommentSection
        form={commentsForm}
        commentParentType="resource_hub_document"
        canComment={document.permissions.canCommentOnDocument}
      />
    </>
  );
}

function DocumentSubscriptions() {
  const { document } = useLoadedData();
  const refresh = Pages.useRefresh();

  assertPresent(document.subscriptionList, "subscriptionList should be present in document");

  return (
    <>
      <div className="border-t border-stroke-base mt-16 mb-8" />

      <CurrentSubscriptions
        potentialSubscribers={document.potentialSubscribers!}
        subscriptionList={document.subscriptionList}
        name="document"
        type="resource_hub_document"
        callback={refresh}
      />
    </>
  );
}

function ContinueEditingDraft() {
  const { document } = useLoadedData();

  const [publish] = usePublishResourceHubDocument();
  const refresh = Pages.useRefresh();
  const editPath = DeprecatedPaths.resourceHubEditDocumentPath(document.id!);

  const publishHandler = async () => {
    await publish({ documentId: document.id });
    refresh();
  };

  return <OngoingDraftActions resource={document} editResourcePath={editPath} publish={publishHandler} />;
}
