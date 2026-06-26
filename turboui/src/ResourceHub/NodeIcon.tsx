import * as React from "react";
import { calculateImageRatio, ImageWithPlaceholder } from "../ImageWithPlaceholder";
import classNames from "../utils/classnames";
import { IconAlignJustified, IconChartColumn, IconFolderFilled, IconLink, IconLogs, IconVideo } from "../icons";
import { getNodeLinkType, getNodeThumbnail, getNodeType, hasNodeContentType, isNodeMovFile, isNodeVideoFile } from "./selectors";
import type { ResourceHubNode } from "./types";
import { LinkIcon } from "./LinkIcon";

export function NodeIcon({ node, size }: { node: ResourceHubNode; size: number }) {
  const nodeType = getNodeType(node);
  const linkType = getNodeLinkType(node);
  const thumbnail = getNodeThumbnail(node);

  if (nodeType === "folder") return <FolderIcon size={size} />;

  if (nodeType === "link") {
    if (linkType && linkType !== "other") return <LinkIcon type={linkType} size={size} />;
    return <FileIcon size={size} icon={IconLink} />;
  }

  if (thumbnail) return <Thumbnail url={thumbnail.url} alt={thumbnail.alt} width={thumbnail.width} height={thumbnail.height} size={size} />;

  if (nodeType === "document") return <FileIcon size={size} icon={IconAlignJustified} color="bg-sky-500" />;
  if (hasNodeContentType(node, "pdf")) return <FileIcon size={size} filetype="pdf" color="bg-red-500" icon={IconAlignJustified} />;
  if (isNodeMovFile(node)) return <FileIcon size={size} filetype="mov" icon={IconVideo} />;
  if (isNodeVideoFile(node)) return <FileIcon size={size} icon={IconVideo} />;
  if (hasNodeContentType(node, "audio")) return <FileIcon size={size} filetype="audio" />;
  if (hasNodeContentType(node, "zip")) return <FileIcon size={size} filetype="zip" icon={IconChartColumn} />;

  return <FileIcon size={size} icon={IconAlignJustified} />;
}

function FolderIcon({ size }: { size: number }) {
  return <IconFolderFilled size={size} className="text-sky-500" />;
}

interface FileIconProps {
  size: number;
  filetype?: string;
  color?: string;
  icon?: React.ElementType;
}

export function FileIcon({ size, filetype, color, icon: Icon = IconLogs }: FileIconProps) {
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

  return (
    <div style={wrapperStyle} className="flex items-center justify-center relative">
      <div className={docClass} style={docSize}>
        <div className="flex-1 flex flex-col items-center justify-center">
          <Icon size={innerIconSize} className="text-surface-outline" />
        </div>

        {filetype && <FileIconBadge size={size} filetype={filetype} color={color} />}
      </div>
    </div>
  );
}

function FileIconBadge({ size, filetype, color }: FileIconProps) {
  const badgeClass = classNames("text-center", "text-white-1", "font-bold", "tracking-widest w-full uppercase", color || "bg-stone-500");

  const style = {
    fontSize: size * 0.17,
    paddingTop: size * 0.07,
    paddingBottom: size * 0.065,
    lineHeight: 1,
  };

  return <div className={badgeClass} style={style} children={filetype} />;
}

function Thumbnail({ url, alt, width, height, size }: { url: string; alt: string; width: number; height: number; size: number }) {
  const padding = 1;
  const imgRatio = calculateImageRatio(width, height);
  const thumbnailWidth = size - padding * 2;
  const thumbnailHeight = thumbnailWidth * imgRatio;

  return (
    <div className="border border-surface-outline shadow rounded-sm overflow-hidden" style={{ padding }}>
      <div style={{ width: thumbnailWidth, height: thumbnailHeight }}>
        <ImageWithPlaceholder src={url} alt={alt} ratio={imgRatio} />
      </div>
    </div>
  );
}
