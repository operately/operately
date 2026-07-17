import React from "react";
import { createPortal } from "react-dom";

import { NodeViewContent, NodeViewWrapper } from "@tiptap/react";
import classnames from "classnames";

import { IconFileFilled, IconFileZip, IconPdf, IconTrash, IconX } from "../../icons";
import classNames from "../../utils/classnames";

let imagePreviewScrollLockCount = 0;
let imagePreviewPreviousBodyOverflow: string | null = null;

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
  const [isModalOpen, setIsModalOpen] = React.useState(false);

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
        "cursor-zoom-in": !view.editable,
      })}
      data-drag-handle
    />
  );

  const imgNode = view.editable ? (
    image
  ) : (
    <button
      type="button"
      className="block max-w-full appearance-none bg-transparent border-0 p-0"
      onClick={() => setIsModalOpen(true)}
      aria-label={`Open ${node.attrs.alt || node.attrs.title || "image"} preview`}
    >
      {image}
    </button>
  );

  return (
    <NodeViewWrapper className="blob-container blob-image relative group">
      <div className="flex items-center justify-center">{imgNode}</div>

      <div className="footer flex flex-wrap items-center gap-x-1 gap-y-0 justify-center">
        <NodeViewContent
          className="title outline-none min-w-0 max-w-full truncate"
          contentEditable={view.editable}
          suppressContentEditableWarning={true}
          onKeyDown={disableEnter}
          onBlur={updateTitle}
        >
          {node.attrs.alt}
        </NodeViewContent>
        {!view.editable && (
          <span className="flex items-center gap-1 shrink-0 whitespace-nowrap">
            <div className="text-content-dimmed text-sm">•</div>
            <a
              className="text-content-dimmed text-sm underline cursor-pointer"
              title={node.attrs.title}
              href={downloadableUrl(node.attrs.src)}
            >
              Download
            </a>
          </span>
        )}
        {!view.editable && (
          <span className="flex items-center gap-1 shrink-0 whitespace-nowrap">
            <div className="text-content-dimmed text-sm">•</div>
            <a className="text-content-dimmed text-sm underline cursor-pointer" href={node.attrs.src} target="_blank">
              View original
            </a>
          </span>
        )}
      </div>

      {!view.editable && (
        <ImagePreviewModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          src={node.attrs.src}
          title={node.attrs.title}
          alt={node.attrs.alt}
        />
      )}

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

function ImagePreviewModal({
  isOpen,
  onClose,
  src,
  title,
  alt,
}: {
  isOpen: boolean;
  onClose: () => void;
  src: string;
  title?: string;
  alt?: string;
}) {
  React.useEffect(() => {
    if (!isOpen || typeof document === "undefined") return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented) {
        event.preventDefault();
        onClose();
      }
    };

    const unlockBodyScroll = lockBodyScroll();
    // Claim Escape before document listeners belonging to lower UI layers, such as a task slide-in.
    document.addEventListener("keydown", handleKeyDown, { capture: true });

    return () => {
      unlockBodyScroll();
      document.removeEventListener("keydown", handleKeyDown, { capture: true });
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title || alt || "Image preview"}
      onClick={onClose}
    >
      <div
        className="relative flex h-[90vh] w-[90vw] flex-col overflow-hidden rounded-lg bg-surface-base shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex min-h-12 items-center justify-between border-b border-surface-outline px-4">
          <div className="min-w-0 truncate text-sm font-medium text-content-accent">{title || alt}</div>
          <button
            type="button"
            className="rounded-full p-1 text-content-subtle transition-colors hover:bg-surface-highlight hover:text-content-base"
            onClick={onClose}
            aria-label="Close image preview"
          >
            <IconX size={20} />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 items-center justify-center bg-surface-dimmed p-4">
          <img src={src} alt={alt || ""} title={title} className="max-h-full max-w-full object-contain" />
        </div>
      </div>
    </div>,
    document.body,
  );
}

function lockBodyScroll() {
  if (imagePreviewScrollLockCount === 0) {
    imagePreviewPreviousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }

  imagePreviewScrollLockCount += 1;

  return () => {
    imagePreviewScrollLockCount = Math.max(0, imagePreviewScrollLockCount - 1);

    if (imagePreviewScrollLockCount === 0) {
      document.body.style.overflow = imagePreviewPreviousBodyOverflow || "";
      imagePreviewPreviousBodyOverflow = null;
    }
  };
}

function FileView({ node, deleteNode, view }) {
  return (
    <NodeViewWrapper className="blob-container relative group bg-surface-dimmed rounded-lg p-2">
      <div className="flex items-center gap-2">
        <div className="shrink-0">
          <FileIcon filetype={node.attrs.filetype} />
        </div>

        <div className="min-w-0">
          <div className="font-medium text-content-accent leading-snug truncate">{node.attrs.title}</div>
          <div className="flex items-center gap-1">
            <div className="text-content-dimmed text-sm">
              <HumanFilesize size={node.attrs.filesize} />
            </div>
            {!view.editable && (
              <span className="flex items-center gap-1 shrink-0 whitespace-nowrap">
                <div className="text-content-dimmed text-sm">•</div>
                <a
                  className="text-content-dimmed text-sm underline cursor-pointer"
                  title={node.attrs.title}
                  href={downloadableUrl(node.attrs.src)}
                >
                  Download
                </a>
              </span>
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

function LoadingProgressBar({ progress, barClassName }: { progress: number; barClassName?: string }) {
  const className = classNames(
    "bg-content-accent rounded-xl text-content-accent font-medium h-5 overflow-hidden",
    barClassName || "",
  );

  return (
    <div className={className}>
      <div className="bg-callout-success-content h-full" style={{ width: `${progress}%` }}></div>
    </div>
  );
}
