import React from "react";

import * as Reactions from "@/models/reactions";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as PageOptions from "@/components/PaperContainer/PageOptions";
import { IconEdit } from "@tabler/icons-react";

import FormattedTime from "@/components/FormattedTime";
import RichContent from "@/components/RichContent";
import Avatar from "@/components/Avatar";
import { TextSeparator } from "@/components/TextSeparator";
import { Spacer } from "@/components/Spacer";
import { Paths } from "@/routes/paths";
import { assertPresent } from "@/utils/assertions";
import { ReactionList, useReactionsForm } from "@/features/Reactions";
import { CommentSection, useComments } from "@/features/CommentSection";
import { CurrentSubscriptions } from "@/features/Subscriptions";

import { useLoadedData } from "./loader";

export function Page() {
  const { document } = useLoadedData();

  return (
    <Pages.Page title={document.name!}>
      <Paper.Root>
        <Navigation />

        <Paper.Body>
          <Options />

          <Title />
          <Body />
          <DocumentReactions />
          <DocumentComments />
          <DocumentSubscriptions />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Navigation() {
  const { document } = useLoadedData();

  assertPresent(document.resourceHub, "resourceHub must be present in document");

  const name = document.parentFolder?.name || document.resourceHub.name;
  const path = document.parentFolder
    ? Paths.resourceHubFolderPath(document.parentFolder.id!)
    : Paths.resourceHubPath(document.resourceHub.id!);

  return (
    <Paper.Navigation>
      <Paper.NavItem linkTo={path}>{name}</Paper.NavItem>
    </Paper.Navigation>
  );
}

function Title() {
  const { document } = useLoadedData();

  assertPresent(document.author, "author must be present in document");

  return (
    <div className="flex flex-col items-center">
      <Paper.Header title={document.name!} />
      <div className="flex flex-wrap justify-center gap-1 items-center mt-2 text-content-accent font-medium text-sm sm:text-[16px]">
        <div className="flex items-center gap-1">
          <Avatar person={document.author} size="tiny" /> {document.author.fullName}
        </div>

        <TextSeparator />
        <FormattedTime time={document.insertedAt!} format="relative-time-or-date" />
      </div>
    </div>
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

function Options() {
  const { document } = useLoadedData();

  assertPresent(document.permissions, "permissions must be present in document");

  return (
    <PageOptions.Root testId="project-options-button" position="top-right">
      {document.permissions.canEditDocument && (
        <PageOptions.Link
          icon={IconEdit}
          title="Edit document"
          to={Paths.resourceHubEditDocumentPath(document.id!)}
          testId="edit-document-link"
        />
      )}
    </PageOptions.Root>
  );
}

function DocumentReactions() {
  const { document } = useLoadedData();

  assertPresent(document.permissions?.canCommentOnDocument, "permissions must be present in discussion");

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
        refresh={() => {}}
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
