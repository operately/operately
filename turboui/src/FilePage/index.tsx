import React from "react";

import { Avatar } from "../Avatar";
import { CommentSection } from "../CommentSection";
import { FormattedTime } from "../FormattedTime";
import * as Forms from "../Forms";
import { calculateImageRatio, ImageWithPlaceholder } from "../ImageWithPlaceholder";
import { Modal } from "../Modal";
import { Page } from "../Page";
import { Reactions } from "../Reactions";
import RichContent, { isContentEmpty } from "../RichContent";
import { Spacer } from "../Spacer";
import { CurrentSubscriptions } from "../Subscriptions";
import { TextSeparator } from "../TextSeparator";

import type { FilePage as FilePageNS } from "./types";

export function FilePage(props: FilePageNS.Props) {
  const hasDescription = props.description != null && !isContentEmpty(props.description);

  return (
    <Page
      title={props.pageTitle}
      size="medium"
      navigation={props.navigation}
      options={props.options}
      testId={props.testId ?? "file-page"}
    >
      <div className="px-12 py-10">
        <Title {...props} />

        <Preview title={props.title} blob={props.blob} />
        <Spacer size={1} />

        <FileInfo
          filename={props.filename}
          fileSize={props.fileSize}
          viewUrl={props.viewUrl}
          onDownload={props.onDownload}
        />

        {hasDescription && (
          <>
            <Spacer size={2} />
            <RichContent
              content={props.description}
              className="text-md sm:text-lg"
              mentionedPersonLookup={props.mentionedPersonLookup}
              parseContent
            />
          </>
        )}

        {!props.hideReactions && (
          <>
            <Spacer size={2} />
            <Reactions {...props.reactions} />
          </>
        )}

        {!props.hideComments && (
          <>
            <Spacer size={4} />
            <div className="border-t border-stroke-base mt-8" />
            <CommentSection {...props.comments} />
          </>
        )}

        {!props.hideSubscriptions && (
          <>
            <div className="border-t border-stroke-base mt-16 mb-8" />
            <CurrentSubscriptions {...props.subscriptions} />
          </>
        )}
      </div>

      {!props.hideDeleteModal && (
        <DeleteFileModal
          isOpen={props.deleteModal.isOpen}
          onClose={props.deleteModal.onClose}
          fileName={props.deleteModal.fileName}
          onConfirm={props.deleteModal.onConfirm}
        />
      )}
    </Page>
  );
}

function Title(props: FilePageNS.BaseProps) {
  return (
    <div className="mb-8 flex flex-col items-center">
      <div className="mb-6 text-content-accent text-lg md:text-2xl font-extrabold">{props.title}</div>
      <div className="flex flex-wrap justify-center gap-1 items-center text-content-accent font-medium text-sm sm:text-[16px]">
        {props.author && (
          <>
            <div className="flex items-center gap-1">
              <Avatar person={props.author} size="tiny" /> {props.author.fullName}
            </div>
            <TextSeparator />
          </>
        )}
        <FormattedTime {...props.formattedTimePreferences} time={props.postedAt} format="relative-time-or-date" />
      </div>
    </div>
  );
}

function Preview({ title, blob }: { title: string; blob: FilePageNS.BlobPreview }) {
  if (blob.contentType?.includes("image")) {
    return <ImageWithPlaceholder src={blob.url} alt={title} ratio={calculateImageRatio(blob.width, blob.height)} />;
  }

  if (blob.contentType?.includes("video")) {
    const ratio = calculateImageRatio(blob.width, blob.height);

    return (
      <div
        style={{
          position: "relative",
          width: "100%",
          paddingBottom: `${ratio * 100}%`,
          overflow: "hidden",
        }}
      >
        <video controls style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}>
          <source src={blob.url} type={blob.contentType || "video/mp4"} />
          Your browser does not support videos.
        </video>
      </div>
    );
  }

  if (blob.contentType?.includes("pdf")) {
    return (
      <div style={{ width: "100%", height: "500px" }}>
        <iframe src={blob.url + "#toolbar=0"} width="100%" height="100%" style={{ border: "none" }} title={title} />
      </div>
    );
  }

  return null;
}

function FileInfo({
  filename,
  fileSize,
  viewUrl,
  onDownload,
}: {
  filename: string;
  fileSize: string;
  viewUrl: string;
  onDownload: () => void;
}) {
  return (
    <div className="flex gap-2 justify-center items-center">
      <div className="text-content-dimmed">
        {filename} ({fileSize})
      </div>
      <div className="text-content-dimmed">•</div>
      <div className="text-content-dimmed underline cursor-pointer" onClick={onDownload}>
        Download
      </div>
      <div className="text-content-dimmed">•</div>
      <a className="text-content-dimmed underline cursor-pointer" href={viewUrl} target="_blank">
        View
      </a>
    </div>
  );
}

function DeleteFileModal({
  isOpen,
  onClose,
  fileName,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  onConfirm: () => void | Promise<void>;
}) {
  const form = Forms.useForm({
    fields: {},
    cancel: onClose,
    submit: async () => {
      await onConfirm();
    },
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Forms.Form form={form}>
        <p>
          Are you sure you want to delete the file "<b>{fileName}</b>"?
        </p>
        <Forms.Submit saveText="Delete" cancelText="Cancel" />
      </Forms.Form>
    </Modal>
  );
}
