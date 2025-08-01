import React from "react";

import { NodeViewWrapper, NodeViewContent } from "@tiptap/react";
import { IconTrash, IconPdf, IconFileZip, IconFileFilled } from "turboui";
import classnames from "classnames";

import { LoadingProgressBar } from "@/components/LoadingProgressBar";

//
// This is view component for the blob node for the TipTap editor.
//
// It has editable and non-editable parts:
// - The blob itself is not editable.
// - The title is editable.
// - The delete button is not editable.
//
// In case of an image, the delete button is only visible when the user hovers over the blob.
//

export function BlobView({ node, deleteNode, updateAttributes, editor }) {
  switch (node.attrs.filetype) {
    case "image/png":
    case "image/jpeg":
    case "image/gif":
      return <ImageView node={node} deleteNode={deleteNode} updateAttributes={updateAttributes} view={editor.view} />;
    case "video/mp4":
    case "video/quicktime":
    case "video/ogg":
      return <VideoView node={node} deleteNode={deleteNode} view={editor.view} updateAttributes={updateAttributes} />;
    default:
      return <FileView node={node} deleteNode={deleteNode} view={editor.view} />;
  }
}

function VideoView({ node, deleteNode, view, updateAttributes }) {
  const disableEnter = (e: React.KeyboardEvent<HTMLSpanElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      return;
    }
  };

  const updateTitle = (e: React.FocusEvent<HTMLSpanElement>) => {
    updateAttributes({
      alt: e.target.innerText,
      title: e.target.innerText,
    });
  };

  return (
    <NodeViewWrapper className="blob-container relative group flex-col justify-center">
      <video src={node.attrs.src} controls data-drag-handle width="640" height="480" className="mb-2"></video>

      <NodeViewContent
        className="title outline-none flex items-center justify-center gap-1 font-medium w-full"
        contentEditable={view.editable}
        suppressContentEditableWarning={true}
        onKeyDown={disableEnter}
        onBlur={updateTitle}
      >
        {node.attrs.alt}
      </NodeViewContent>

      {view.editable && node.attrs.status === "uploading" && (
        <div className="top-1/2 left-1/2 absolute transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
          <LoadingProgressBar progress={node.attrs.progress} barClassName="w-32" />
        </div>
      )}

      {view.editable && (
        <div className="absolute top-2 right-2 p-2 hover:scale-105 bg-red-400 rounded-full group-hover:opacity-100 opacity-0 cursor-pointer transition-opacity">
          <IconTrash onClick={deleteNode} size={16} className="text-content-accent" />
        </div>
      )}
    </NodeViewWrapper>
  );
}

function ImageView({ node, deleteNode, updateAttributes, view }) {
  const disableEnter = (e: React.KeyboardEvent<HTMLSpanElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      return;
    }
  };

  const updateTitle = (e: React.FocusEvent<HTMLSpanElement>) => {
    updateAttributes({
      alt: e.target.innerText,
      title: e.target.innerText,
    });
  };

  const image = (
    <img
      src={node.attrs.src}
      alt={node.attrs.alt}
      title={node.attrs.title}
      className={classnames({
        "group-hover:border-stroke-base transition-colors": view.editable,
        "cursor-pointer": !view.editable,
      })}
      data-drag-handle
    />
  );

  const imgNode = view.editable ? (
    image
  ) : (
    <a href={node.attrs.src} target="_blank">
      {image}
    </a>
  );

  return (
    <NodeViewWrapper className="blob-container blob-image relative group">
      <div className="flex items-center justify-center">{imgNode}</div>

      <div className="footer flex items-center gap-1 justify-center">
        <NodeViewContent
          className="title outline-none"
          contentEditable={view.editable}
          suppressContentEditableWarning={true}
          onKeyDown={disableEnter}
          onBlur={updateTitle}
        >
          {node.attrs.alt}
        </NodeViewContent>
        {!view.editable && (
          <>
            <div className="text-content-dimmed text-sm">•</div>
            <a
              className="text-content-dimmed text-sm underline cursor-pointer"
              title={node.attrs.title}
              href={downloadableUrl(node.attrs.src)}
            >
              Download
            </a>
          </>
        )}
        {!view.editable && (
          <>
            <div className="text-content-dimmed text-sm">•</div>
            <a className="text-content-dimmed text-sm underline cursor-pointer" href={node.attrs.src} target="_blank">
              View
            </a>
          </>
        )}
      </div>

      {view.editable && node.attrs.status === "uploading" && (
        <div className="top-1/2 left-1/2 absolute transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
          <LoadingProgressBar progress={node.attrs.progress} barClassName="w-32" />
        </div>
      )}

      {view.editable && (
        <div className="absolute top-2 right-2 p-2 hover:scale-105 bg-red-400 rounded-full group-hover:opacity-100 opacity-0 cursor-pointer transition-opacity">
          <IconTrash onClick={deleteNode} size={16} className="text-content-accent" />
        </div>
      )}
    </NodeViewWrapper>
  );
}

function FileView({ node, deleteNode, view }) {
  return (
    <NodeViewWrapper className="blob-container relative group bg-surface-dimmed rounded-lg p-2">
      <div className="flex items-center gap-2">
        <div className="shrink-0">
          <FileIcon filetype={node.attrs.filetype} />
        </div>

        <div>
          <div className="font-medium text-content-accent leading-snug">{node.attrs.title}</div>
          <div className="flex items-center gap-1">
            <div className="text-content-dimmed text-sm">
              <HumanFilesize size={node.attrs.filesize} />
            </div>
            {!view.editable && (
              <>
                <div className="text-content-dimmed text-sm">•</div>
                <a
                  className="text-content-dimmed text-sm underline cursor-pointer"
                  title={node.attrs.title}
                  href={downloadableUrl(node.attrs.src)}
                >
                  Download
                </a>
              </>
            )}
          </div>
        </div>
      </div>

      {view.editable && node.attrs.status === "uploading" && (
        <div className="top-1/2 left-1/2 absolute transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
          <LoadingProgressBar progress={node.attrs.progress} barClassName="w-32" />
        </div>
      )}

      {view.editable && (
        <div className="absolute top-2 right-2 p-2 hover:scale-105 bg-red-400 rounded-full group-hover:opacity-100 opacity-0 cursor-pointer transition-opacity">
          <IconTrash onClick={deleteNode} size={16} className="text-content-accent" />
        </div>
      )}
    </NodeViewWrapper>
  );
}

function HumanFilesize({ size }: { size: number }) {
  const i = Math.floor(Math.log(size) / Math.log(1024));
  const humanValue = `${(size / Math.pow(1024, i)).toFixed(2)} ${["B", "kB", "MB", "GB", "TB"][i]}`;

  return <>{humanValue}</>;
}

function FileIcon({ filetype }: { filetype: string }) {
  switch (filetype) {
    case "application/pdf":
      return <IconPdf className="text-content-accent" size={48} data-drag-handle strokeWidth={1} />;
    case "application/zip":
      return <IconFileZip className="text-content-accent" size={48} data-drag-handle strokeWidth={1} />;
    case "text/plain":
      return <IconFileFilled className="text-content-accent" size={48} data-drag-handle strokeWidth={1} />;
    default:
      return <IconFileFilled className="text-content-accent" size={48} data-drag-handle strokeWidth={1} />;
  }
}

function downloadableUrl(url: string) {
  return url + "?disposition=attachment";
}
