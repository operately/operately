import React from "react";

import * as Hub from "@/models/resourceHubs";
import * as Icons from "@tabler/icons-react";

import { assertPresent } from "@/utils/assertions";
import { ImageWithPlaceholder } from "@/components/Image";
import classNames from "classnames";

export function NodeIcon({ node, size }: { node: Hub.ResourceHubNode; size: number }) {
  if (Hub.isFolder(node)) {
    return <FolderIcon size={size} />;
  }

  if (Hub.isImage(node)) {
    return <Thumbnail file={node.file!} size={size} />;
  }

  if (Hub.isDocument(node)) {
    return <DocumentIcon size={size} />;
  }

  if (Hub.hasContentType(node, "pdf")) {
    return <FileIcon size={size} filetype="pdf" color="bg-red-500" icon={Icons.IconAlignJustified} />;
  }

  if (Hub.hasContentType(node, "video")) {
    return <FileIcon size={size} icon={Icons.IconVideo} />;
  }

  if (Hub.hasContentType(node, "audio")) {
    return <FileIcon size={size} filetype="audio" />;
  }

  if (Hub.hasContentType(node, "zip")) {
    return <FileIcon size={size} filetype="zip" icon={Icons.IconChartColumn} />;
  }

  if (Hub.hasContentType(node, "mov")) {
    return <FileIcon size={size} filetype="mov" icon={Icons.IconVideo} />;
  }

  return <FileIcon size={size} icon={Icons.IconAlignJustified} />;
}

export function FolderIcon({ size }: { size: number }) {
  return <Icons.IconFolderFilled size={size} className="text-sky-500" />;
}

function DocumentIcon({ size }: { size: number }) {
  return (
    <div style={{ width: size, height: size }} className="flex items-center justify-center relative">
      <div
        className="bg-surface-base border border-stroke-base rounded-sm shadow-sm flex flex-col items-center justify-center gap-0.5 relative"
        style={{ width: size * 0.79, height: size }}
      >
        <div className="text-sm absolute top-[1px] left-[4px] text-stone-700">A</div>
        <div className="h-0.5 bg-stone-300 absolute top-1 left-4 right-1"></div>
        <div className="h-0.5 bg-stone-300 absolute top-2 left-4 right-1"></div>
        <div className="h-0.5 bg-stone-300 absolute top-3 left-4 right-1"></div>
        <div className="h-0.5 bg-stone-300 absolute top-4 left-4 right-1"></div>
        <div className="h-0.5 bg-stone-300 absolute top-5 left-1 right-1"></div>
        <div className="h-0.5 bg-stone-300 absolute top-6 left-1 right-1"></div>
        <div className="h-0.5 bg-stone-300 absolute top-7 left-1 right-1"></div>
        <div className="h-0.5 bg-stone-300 absolute top-8 left-1 right-1"></div>
        <div className="h-0.5 bg-stone-300 absolute top-9 left-1 right-1"></div>
        <div className="h-0.5 bg-stone-300 absolute top-10 left-1 right-1"></div>

        <div className="absolute top-0 left-0 w-0 h-0 border-t border-r border-stone-300"></div>
      </div>
    </div>
  );
}

function FileIcon({ size, filetype, color, icon }: { size: number; filetype?: string; color?: string; icon?: any }) {
  const badgeClass = classNames(
    "text-center",
    "text-[8px] py-[0.5]",
    "text-white-1",
    "font-bold",
    "tracking-widest w-full uppercase",
    color || "bg-stone-500",
  );

  icon = icon || Icons.IconLogs;

  return (
    <div style={{ width: size, height: size }} className="flex items-center justify-center relative">
      <div
        className="bg-surface-base border border-stroke-base rounded-sm shadow-sm flex flex-col items-center justify-center gap-0.5"
        style={{ width: size * 0.7, height: size }}
      >
        {React.createElement(icon, { size: size * 0.5, className: "text-surface-outline" })}
        {filetype && <div className={badgeClass}>{filetype}</div>}
      </div>
    </div>
  );
}

function Thumbnail({ file, size }: { file: Hub.ResourceHubFile; size: number }) {
  assertPresent(file.blob, "blob must be present in file");

  const padding = 1;
  const imgRatio = file.blob.height! / file.blob.width!;

  const width = size - padding * 2;
  const height = width * imgRatio;

  return (
    <div className="border border-surface-outline shadow rounded-sm overflow-hidden" style={{ padding }}>
      <div style={{ width, height }}>
        <ImageWithPlaceholder src={file.blob.url!} alt={file.name!} ratio={imgRatio} />
      </div>
    </div>
  );
}
