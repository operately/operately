import React from "react";

import { useBoolState } from "@/hooks/useBoolState";
import { useNavigate } from "react-router-dom";
import { useDeleteResourceHubFile } from "@/models/resourceHubs";
import { usePaths } from "@/routes/paths";

import * as Reactions from "@/models/reactions";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import Modal from "@/components/Modal";
import Forms from "@/components/Forms";

import { findFileSize, useDownloadFile } from "@/models/blobs";
import { CommentSection, useComments } from "@/features/CommentSection";
import { ReactionList, useReactionsForm } from "@/features/Reactions";
import { useCurrentSubscriptionsAdapter } from "@/models/subscriptions";
import { Spacer } from "@/components/Spacer";
import { assertPresent } from "@/utils/assertions";
import { Avatar, richContentToString, RichContent, CurrentSubscriptions } from "turboui";
import FormattedTime from "@/components/FormattedTime";
import { TextSeparator } from "@/components/TextSeparator";
import { ResourcePageNavigation } from "@/features/ResourceHub";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";

import { useLoadedData } from "./loader";
import { Content } from "./Content";
import { Options } from "./Options";

export function Page() {
  const { file } = useLoadedData();
  const [showDeleteModal, toggleDeleteModal] = useBoolState(false);

  return (
    <Pages.Page title={file.name!}>
      <Paper.Root>
        <ResourcePageNavigation resource={file} />

        <Paper.Body>
          <Title />
          <Options showDeleteModal={toggleDeleteModal} />

          <Content />
          <Spacer size={1} />

          <FileInfo />
          <Description />

          <FileReactions />
          <FileComments />
          <FileSubscriptions />

          <DeleteFileModal isOpen={showDeleteModal} hideModal={toggleDeleteModal} fileName={file.name || ""} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
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
  assertPresent(file.blob?.url, "url must be present in file.blob");
  assertPresent(file.blob.size, "size must be present in file.blob");
  assertPresent(file.name, "name must be present in file");

  const size = findFileSize(file.blob.size);
  const [downloadFile] = useDownloadFile(file.blob.url, file.name);

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

  const { mentionedPersonLookup } = useRichEditorHandlers();
  const hasDescription = Boolean(richContentToString(JSON.parse(file.description)).trim());

  if (!hasDescription) return <></>;

  return (
    <>
      <Spacer size={2} />
      <RichContent
        content={file.description}
        className="text-md sm:text-lg"
        mentionedPersonLookup={mentionedPersonLookup}
        parseContent
      />
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
        commentParentType="resource_hub_file"
        canComment={file.permissions.canCommentOnFile}
      />
    </>
  );
}

interface DeleteFileModalProps {
  isOpen: boolean;
  hideModal: () => void;
  fileName: string;
}

function DeleteFileModal({ isOpen, hideModal, fileName }: DeleteFileModalProps) {
  const { file } = useLoadedData();
  const navigate = useNavigate();
  const [remove] = useDeleteResourceHubFile();
  const paths = usePaths();

  const handleDeleteFile = async () => {
    await remove({ fileId: file.id });

    if (file.parentFolder) {
      navigate(paths.resourceHubFolderPath(file.parentFolder.id!));
    } else {
      assertPresent(file.resourceHub, "resourceHub must be present in file");
      navigate(paths.resourceHubPath(file.resourceHub.id!));
    }
  };

  const form = Forms.useForm({
    fields: {},
    cancel: hideModal,
    submit: handleDeleteFile,
  });

  return (
    <Modal isOpen={isOpen} hideModal={hideModal}>
      <Forms.Form form={form}>
        <p>
          Are you sure you want to delete the file "<b>{fileName}</b>"?
        </p>
        <Forms.Submit saveText="Delete" cancelText="Cancel" />
      </Forms.Form>
    </Modal>
  );
}

function FileSubscriptions() {
  const { file, isCurrentUserSubscribed } = useLoadedData();
  const refresh = Pages.useRefresh();

  if (!file.potentialSubscribers || !file.subscriptionList) {
    return null;
  }

  const subscriptionsState = useCurrentSubscriptionsAdapter({
    potentialSubscribers: file.potentialSubscribers,
    subscriptionList: file.subscriptionList,
    resourceName: "file",
    type: "resource_hub_file",
    onRefresh: refresh,
  });

  return (
    <>
      <div className="border-t border-stroke-base mt-16 mb-8" />

      <CurrentSubscriptions
        {...subscriptionsState}
        isCurrentUserSubscribed={isCurrentUserSubscribed}
        canEditSubscribers={file.permissions?.canEditFile || false}
      />
    </>
  );
}
