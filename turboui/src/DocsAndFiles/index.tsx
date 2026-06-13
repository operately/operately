import * as React from "react";

import { DivLink, Link } from "../Link";
import { IconAlignJustified, IconChartColumn, IconFolderFilled, IconLink, IconLogs, IconVideo } from "../icons";
import {
  getNodeCommentsCount,
  getNodeContentType,
  getNodeId,
  getNodeName,
  getNodeThumbnail,
  getNodeType,
} from "../ResourceHub/selectors";
import type { ResourceHubNode } from "../ResourceHub/types";
import classNames from "../utils/classnames";

const DEFAULT_PREVIEW_LIMIT = 5;

interface DocsAndFilesPreviewProps {
  nodes: ResourceHubNode[];
  tabPath: string;
  getNodePath: (node: ResourceHubNode) => string;
  limit?: number;
}

export function DocsAndFilesPreview({
  nodes,
  tabPath,
  getNodePath,
  limit = DEFAULT_PREVIEW_LIMIT,
}: DocsAndFilesPreviewProps) {
  const recentNodes = React.useMemo(() => [...nodes].sort(compareNodesByUpdatedAt).slice(0, limit), [nodes, limit]);
  const hiddenCount = Math.max(nodes.length - recentNodes.length, 0);
  const hiddenCountLabel = hiddenCount === 1 ? "1 more" : `${hiddenCount} more`;

  return (
    <div className="space-y-3" data-test-id="docs-and-files-preview">
      <div className="flex items-center gap-2">
        <h2 className="font-bold">Docs & Files</h2>
      </div>

      {recentNodes.length > 0 ? (
        <div className="space-y-1">
          {recentNodes.map((node, index) => (
            <DocsAndFilesPreviewItem
              key={getNodeId(node) ?? `${getNodePath(node)}-${index}`}
              node={node}
              path={getNodePath(node)}
            />
          ))}
          {hiddenCount > 0 && (
            <Link to={tabPath} underline="hover" className="inline-block pt-1 text-sm font-medium">
              Show {hiddenCountLabel}
            </Link>
          )}
        </div>
      ) : (
        <div className="text-sm text-content-dimmed">
          No support materials yet.{" "}
          <Link to={tabPath} underline="hover" className="font-medium">
            Add files, docs, or links
          </Link>
        </div>
      )}
    </div>
  );
}

function DocsAndFilesPreviewItem({ node, path }: { node: ResourceHubNode; path: string }) {
  return (
    <DivLink
      to={path}
      className="group -mx-1 flex items-center justify-between gap-3 rounded-sm px-1 py-1.5 hover:bg-surface-dimmed"
    >
      <div className="flex min-w-0 items-center gap-2">
        <DocsAndFilesIcon node={node} size={22} />
        <div className="min-w-0 flex items-baseline gap-2">
          <div className="truncate text-sm font-medium text-content-base group-hover:text-link-base">{getNodeName(node)}</div>
        </div>
      </div>
      <CommentsCountIndicator count={getNodeCommentsCount(node)} size={18} />
    </DivLink>
  );
}

function DocsAndFilesIcon({ node, size }: { node: ResourceHubNode; size: number }) {
  if (getNodeType(node) === "folder") {
    return <IconFolderFilled size={size} className="shrink-0 text-sky-500" />;
  }

  if (getNodeType(node) === "link") {
    return <FileIcon size={size} icon={IconLink} />;
  }

  const thumbnail = getNodeThumbnail(node);

  if (getNodeType(node) === "document") {
    return <FileIcon size={size} icon={IconAlignJustified} color="bg-sky-500" />;
  }

  if (thumbnail && hasContentType(node, "image")) {
    return <Thumbnail thumbnail={thumbnail} size={size} />;
  }

  if (hasContentType(node, "pdf")) return <FileIcon size={size} filetype="pdf" color="bg-red-500" icon={IconAlignJustified} />;
  if (hasContentType(node, "video")) return <FileIcon size={size} icon={IconVideo} />;
  if (hasContentType(node, "audio")) return <FileIcon size={size} filetype="audio" />;
  if (hasContentType(node, "zip")) return <FileIcon size={size} filetype="zip" icon={IconChartColumn} />;
  if (hasContentType(node, "mov")) return <FileIcon size={size} filetype="mov" icon={IconVideo} />;

  return <FileIcon size={size} icon={IconAlignJustified} />;
}

function hasContentType(node: ResourceHubNode, contentType: string) {
  return getNodeType(node) === "file" && Boolean(getNodeContentType(node)?.includes(contentType));
}

function compareNodesByUpdatedAt(left: ResourceHubNode, right: ResourceHubNode) {
  return nodeTimestamp(right) - nodeTimestamp(left);
}

function nodeTimestamp(node: ResourceHubNode) {
  return Date.parse(node.updatedAt || node.insertedAt || "") || 0;
}

function CommentsCountIndicator({ count, size }: { count: number; size: number }) {
  if (count < 1) return null;

  const style = {
    width: size,
    height: size,
    fontSize: size * 0.6,
    fontWeight: size > 20 ? "normal" : "bold",
  } as const;

  return (
    <div className="bg-blue-500 text-white-1 flex items-center justify-center rounded-full" style={style}>
      {count}
    </div>
  );
}

function FileIcon({
  size,
  filetype,
  color,
  icon: Icon = IconLogs,
}: {
  size: number;
  filetype?: string;
  color?: string;
  icon?: React.ComponentType<{ size: number; className?: string }>;
}) {
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
    <div style={wrapperStyle} className="flex shrink-0 items-center justify-center relative">
      <div className={docClass} style={docSize}>
        <div className="flex-1 flex flex-col items-center justify-center">
          <Icon size={innerIconSize} className="text-surface-outline" />
        </div>

        {filetype && <FileIconBadge size={size} filetype={filetype} color={color} />}
      </div>
    </div>
  );
}

function FileIconBadge({ size, filetype, color }: { size: number; filetype: string; color?: string }) {
  const badgeClass = classNames("text-center", "text-white-1", "font-bold", "tracking-widest w-full uppercase", color || "bg-stone-500");

  const style = {
    fontSize: size * 0.17,
    paddingTop: size * 0.07,
    paddingBottom: size * 0.065,
    lineHeight: 1,
  };

  return (
    <div className={badgeClass} style={style}>
      {filetype}
    </div>
  );
}

function Thumbnail({
  thumbnail,
  size,
}: {
  thumbnail: NonNullable<ReturnType<typeof getNodeThumbnail>>;
  size: number;
}) {
  const padding = 1;
  const ratio = thumbnail.width && thumbnail.height ? thumbnail.height / thumbnail.width : 1;
  const width = size - padding * 2;
  const height = width * ratio;

  return (
    <div className="border border-surface-outline shadow rounded-sm overflow-hidden shrink-0" style={{ padding }}>
      <div style={{ width, height }}>
        <img src={thumbnail.url} alt={thumbnail.alt} className="block h-full w-full object-cover" />
      </div>
    </div>
  );
}
