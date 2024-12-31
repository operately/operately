import React from "react";

import * as Reactions from "@/models/reactions";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

import { findFileSize, useDownloadFile } from "@/models/blobs";
import { CommentSection, useComments } from "@/features/CommentSection";
import { ReactionList, useReactionsForm } from "@/features/Reactions";
import { CurrentSubscriptions } from "@/features/Subscriptions";
import RichContent, { richContentToString } from "@/components/RichContent";
import { Spacer } from "@/components/Spacer";
import { assertPresent } from "@/utils/assertions";
import Avatar from "@/components/Avatar";
import FormattedTime from "@/components/FormattedTime";
import { TextSeparator } from "@/components/TextSeparator";
import { NestedFolderNavigation } from "@/features/ResourceHub";

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
          <Title />
          <Options />

          <Content />
          <Spacer size={1} />

          <FileInfo />
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
  assertPresent(file.resourceHub.space, "space must be present in file.resourceHub");
  assertPresent(file.pathToFile, "pathToFile must be present in file");

  return (
    <Paper.Navigation testId="navigation">
      <Paper.NavSpaceLink space={file.resourceHub.space} />
      <Paper.NavSeparator />
      <Paper.NavResourceHubLink resourceHub={file.resourceHub} />
      <NestedFolderNavigation folders={file.pathToFile} />
    </Paper.Navigation>
  );
}

function Title() {
  const { file } = useLoadedData();

  assertPresent(file.author, "author must be present in file");

  return (
    <div className="mb-8 flex flex-col items-center">
      <Paper.Header title={file.name!} />
      <div className="flex flex-wrap justify-center gap-1 items-center text-content-accent font-medium text-sm sm:text-[16px]">
        <div className="flex items-center gap-1">
          <Avatar person={file.author} size="tiny" /> {file.author.fullName}
        </div>

        <TextSeparator />
        <FormattedTime time={file.insertedAt!} format="relative-time-or-date" />
      </div>
    </div>
  );
}

function FileInfo() {
  const { file } = useLoadedData();
  assertPresent(file.blob?.filename, "filename must be present in file.blob");

  const size = findFileSize(file.blob.size!);
  const [downloadFile] = useDownloadFile(file.blob.url!, file.blob.filename!);

  return (
    <div className="flex gap-2 justify-center items-center">
      <div className="text-content-dimmed">
        {file.blob.filename} ({size})
      </div>
      <div className="text-content-dimmed">•</div>
      <div className="text-content-dimmed underline cursor-pointer" onClick={downloadFile}>
        Download
      </div>
      <div className="text-content-dimmed">•</div>
      <a className="text-content-dimmed underline cursor-pointer" href={file.blob.url!} target="_blank">
        View
      </a>
    </div>
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
