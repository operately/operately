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

  if (Hub.isLink(node)) {
    return <FileIcon size={size} icon={Icons.IconLink} />;
  }

  if (Hub.isImage(node)) {
    return <Thumbnail file={node.file!} size={size} />;
  }

  if (Hub.isDocument(node)) {
    return <FileIcon size={size} icon={Icons.IconAlignJustified} color="bg-sky-500" />;
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

interface FileIconProps {
  size: number;
  filetype?: string;
  color?: string;
  icon?: any;
}

function FileIcon({ size, filetype, color, icon }: FileIconProps) {
  const wrapperStyle = { width: size, height: size };
  const docSize = { width: size * 0.7, height: size };
  const innerIconSize = size * 0.45;

  const docClass = classNames(
    "bg-surface-base",
    "border border-stroke-base",
    "rounded-sm",
    "shadow-sm",
    "flex flex-col items-center justify-between gap-0.5",
  );

  icon = icon || Icons.IconLogs;

  return (
    <div style={wrapperStyle} className="flex items-center justify-center relative">
      <div className={docClass} style={docSize}>
        <div className="flex-1 flex flex-col items-center justify-center">
          {React.createElement(icon, { size: innerIconSize, className: "text-surface-outline" })}
        </div>

        {filetype && <FileIconBadge size={size} filetype={filetype} color={color} />}
      </div>
    </div>
  );
}

function FileIconBadge({ size, filetype, color }: FileIconProps) {
  const badgeClass = classNames(
    "text-center",
    "text-white-1",
    "font-bold",
    "tracking-widest w-full uppercase",
    color || "bg-stone-500",
  );

  const style = {
    fontSize: size * 0.17,
    paddingTop: size * 0.07,
    paddingBottom: size * 0.065,
    lineHeight: 1,
  };

  return <div className={badgeClass} style={style} children={filetype} />;
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
