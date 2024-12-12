import React from "react";

import * as Reactions from "@/models/reactions";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

import { findFileExtension } from "@/models/blobs";
import { CommentSection, useComments } from "@/features/CommentSection";
import { ReactionList, useReactionsForm } from "@/features/Reactions";
import { CurrentSubscriptions } from "@/features/Subscriptions";
import RichContent, { richContentToString } from "@/components/RichContent";
import { Spacer } from "@/components/Spacer";
import { assertPresent } from "@/utils/assertions";
import { Paths } from "@/routes/paths";

import { useLoadedData } from "./loader";
import { Content } from "./Content";
import { Options } from "./Options";

export function Page() {
  const { file } = useLoadedData();

  return (
    <Pages.Page title={file.name!}>
      <Paper.Root>
        <Navigation />

        <Paper.Body>
          <Paper.Header title={file.name!} layout="title-left-actions-right" />
          <Options />

          <Content />
          <FileNameAndType />
          <Description />
          <FileReactions />
          <FileComments />
          <FileSubscriptions />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Navigation() {
  const { file } = useLoadedData();

  assertPresent(file.resourceHub, "resourceHub must be present in file");

  const name = file.parentFolder?.name || file.resourceHub.name;
  const path = file.parentFolder
    ? Paths.resourceHubFolderPath(file.parentFolder.id!)
    : Paths.resourceHubPath(file.resourceHub.id!);

  return (
    <Paper.Navigation>
      <Paper.NavItem linkTo={path}>{name}</Paper.NavItem>
    </Paper.Navigation>
  );
}

function FileNameAndType() {
  const { file } = useLoadedData();
  assertPresent(file.blob?.filename, "filename must be present in file.blob");

  const extension = findFileExtension(file.blob.filename);

  return (
    <>
      <Spacer size={1} />
      <div className="flex gap-4 items-center">
        <div>
          <b>File:</b> {file.blob.filename}
        </div>
        <div>&middot;</div>
        <div>
          <b>Type:</b> {extension}
        </div>
      </div>
    </>
  );
}

function Description() {
  const { file } = useLoadedData();
  assertPresent(file.description, "description must be present in file");

  const hasDescription = Boolean(richContentToString(JSON.parse(file.description)).trim());

  if (!hasDescription) return <></>;

  return (
    <>
      <Spacer size={2} />
      <RichContent jsonContent={file.description} className="text-md sm:text-lg" />
    </>
  );
}

function FileReactions() {
  const { file } = useLoadedData();

  assertPresent(file.permissions?.canCommentOnFile, "permissions must be present in file");
  assertPresent(file.reactions, "reactions must be present in file");

  const entity = Reactions.entity(file.id!, "resource_hub_file");
  const addReactionForm = useReactionsForm(entity, file.reactions);

  return (
    <>
      <Spacer size={2} />
      <ReactionList size={24} form={addReactionForm} canAddReaction={file.permissions.canCommentOnFile} />
    </>
  );
}

function FileComments() {
  const { file } = useLoadedData();
  const commentsForm = useComments({ parentType: "resource_hub_file", file: file });

  assertPresent(file.permissions?.canCommentOnFile, "permissions must be present in file");

  return (
    <>
      <Spacer size={4} />
      <div className="border-t border-stroke-base mt-8" />
      <CommentSection
        form={commentsForm}
        refresh={() => {}}
        commentParentType="resource_hub_file"
        canComment={file.permissions.canCommentOnFile}
      />
    </>
  );
}

function FileSubscriptions() {
  const { file } = useLoadedData();
  const refresh = Pages.useRefresh();

  assertPresent(file.potentialSubscribers, "potentialSubscribers should be present in file");
  assertPresent(file.subscriptionList, "subscriptionList should be present in file");

  return (
    <>
      <div className="border-t border-stroke-base mt-16 mb-8" />

      <CurrentSubscriptions
        potentialSubscribers={file.potentialSubscribers}
        subscriptionList={file.subscriptionList}
        name="file"
        type="resource_hub_file"
        callback={refresh}
      />
    </>
  );
}
