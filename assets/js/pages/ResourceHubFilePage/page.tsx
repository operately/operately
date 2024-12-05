import React from "react";

import * as Reactions from "@/models/reactions";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

import { ReactionList, useReactionsForm } from "@/features/Reactions";
import { Spacer } from "@/components/Spacer";
import { assertPresent } from "@/utils/assertions";

import { useLoadedData } from "./loader";
import { Content } from "./Content";
import { CommentSection, useComments } from "@/features/CommentSection";
import { CurrentSubscriptions } from "@/features/Subscriptions";

export function Page() {
  const { file } = useLoadedData();

  return (
    <Pages.Page title={file.name!}>
      <Paper.Root>
        <Paper.Body>
          <Paper.Header title={file.name!} layout="title-left-actions-right" />

          <Content />
          <FileReactions />
          <FileComments />
          <FileSubscriptions />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
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
