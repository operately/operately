import * as React from "react";

import { DivLink, Link } from "../Link";
import { Menu, MenuActionItem } from "../Menu";
import { createTestId } from "../TestableElement";
import {
  IconAlignJustified,
  IconChartColumn,
  IconCheck,
  IconChevronDown,
  IconChevronRight,
  IconFile,
  IconFolderFilled,
  IconLink,
  IconLogs,
  IconVideo,
} from "../icons";
import {
  getNodeCommentsCount,
  getNodeId,
  getNodeName,
  getNodeThumbnail,
  getNodeType,
  hasNodeContentType,
  isNodeMovFile,
  isNodeVideoFile,
} from "../ResourceHub/selectors";
import type { ResourceHubNode } from "../ResourceHub/types";
import classNames from "../utils/classnames";
import { DOCS_AND_FILES_SORT_OPTIONS, getRecentPreviewNodes, sortDocsAndFilesItems } from "./sorting";
import { plurarize } from "../utils/plurarize";

export namespace DocsAndFiles {
  export type ItemType = "document" | "folder" | "file" | "link";
  export type FileKind = "audio" | "default" | "image" | "mov" | "pdf" | "video" | "zip";
  export type SortBy = "name" | "insertedAt" | "updatedAt";

  export interface Item {
    id: string;
    name: string;
    type: ItemType;
    link: string;
    insertedAt?: string | null;
    updatedAt?: string | null;
    commentsCount?: number;
    details?: string[];
    fileKind?: FileKind;
    fileTypeLabel?: string;
    thumbnail?: ThumbnailLike | null;
    menu?: React.ReactNode;
  }

  export interface DraftPrompt {
    count: number;
    link: string;
  }

  export interface Breadcrumb {
    label: string;
    link: string;
  }

  export interface TabProps {
    title: string;
    items: Item[];
    addAction?: React.ReactNode;
    draftPrompt?: DraftPrompt | null;
    uploadForm?: React.ReactNode;
    folderModal?: React.ReactNode;
    breadcrumbs?: Breadcrumb[];
    emptyStateKind?: "resourceHub" | "folder";
    hideEmptyState?: boolean;
    className?: string;
  }
}

interface DocsAndFilesPreviewProps {
  nodes: ResourceHubNode[];
  tabPath: string;
  getNodePath: (node: ResourceHubNode) => string;
  limit?: number;
}

type ThumbnailLike = {
  url: string;
  alt: string;
  width?: number | null;
  height?: number | null;
};

const DEFAULT_PREVIEW_LIMIT = 5;

export function DocsAndFilesPreview({
  nodes,
  tabPath,
  getNodePath,
  limit = DEFAULT_PREVIEW_LIMIT,
}: DocsAndFilesPreviewProps) {
  const recentNodes = React.useMemo(() => getRecentPreviewNodes(nodes, limit), [nodes, limit]);
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

export function DocsAndFilesTab({
  title,
  items,
  addAction,
  draftPrompt,
  uploadForm,
  folderModal,
  breadcrumbs,
  emptyStateKind = "resourceHub",
  hideEmptyState = false,
  className = "p-4 max-w-6xl mx-auto my-6",
}: DocsAndFiles.TabProps) {
  const [sortBy, setSortBy] = React.useState<DocsAndFiles.SortBy>("name");
  const sortedItems = React.useMemo(() => sortDocsAndFilesItems(items, sortBy), [items, sortBy]);
  const showEmptyState = sortedItems.length < 1 && !hideEmptyState;

  return (
    <div className={className} data-test-id="docs-and-files-tab">
      <div className="flex items-start justify-between gap-4 border-b border-surface-outline pb-4">
        <div className="min-w-0">
          <Breadcrumbs breadcrumbs={breadcrumbs} />
          <div className="truncate text-xl font-semibold tracking-tight">{title}</div>
        </div>
        {addAction}
      </div>

      <DraftPrompt prompt={draftPrompt} />
      {uploadForm}

      {showEmptyState ? (
        <EmptyState kind={emptyStateKind} />
      ) : (
        sortedItems.length > 0 && (
          <>
            <div className="flex items-center justify-between border-b border-surface-outline py-3">
              <div className="text-sm font-medium text-content-dimmed">{plurarize(sortedItems.length, "item", "items")}</div>
              <SortControl sortBy={sortBy} onSortChange={setSortBy} />
            </div>
            <DocsAndFilesList items={sortedItems} />
          </>
        )
      )}

      {folderModal}
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
        <DocsAndFilesNodeIcon node={node} size={22} />
        <div className="min-w-0 flex items-baseline gap-2">
          <div className="truncate text-sm font-medium text-content-base group-hover:text-link-base">{getNodeName(node)}</div>
        </div>
      </div>
      <CommentsCountIndicator count={getNodeCommentsCount(node)} size={18} />
    </DivLink>
  );
}

function Breadcrumbs({ breadcrumbs }: { breadcrumbs?: DocsAndFiles.Breadcrumb[] }) {
  if (!breadcrumbs || breadcrumbs.length < 1) return null;

  return (
    <nav
      className="mb-1.5 flex min-w-0 items-center gap-1 overflow-x-auto whitespace-nowrap text-sm text-content-dimmed"
      data-test-id="navigation"
    >
      {breadcrumbs.map((breadcrumb, index) => (
        <React.Fragment key={`${breadcrumb.link}-${breadcrumb.label}`}>
          {index > 0 && <IconChevronRight size={14} className="shrink-0 text-content-subtle" />}
          <Link
            to={breadcrumb.link}
            underline="hover"
            testId={createTestId("nav-item", breadcrumb.label)}
            className="shrink-0 font-medium text-content-dimmed"
          >
            {breadcrumb.label}
          </Link>
        </React.Fragment>
      ))}
    </nav>
  );
}

function DraftPrompt({ prompt }: { prompt?: DocsAndFiles.DraftPrompt | null }) {
  if (!prompt || prompt.count < 1) return null;

  const label =
    prompt.count === 1
      ? "Continue writing your draft document..."
      : `Continue writing your ${prompt.count} draft documents...`;

  return (
    <div className="flex justify-center py-3">
      <Link className="font-medium" to={prompt.link} testId="continue-editing-draft">
        {label}
      </Link>
    </div>
  );
}

function DocsAndFilesList({ items }: { items: DocsAndFiles.Item[] }) {
  return (
    <div className="divide-y divide-surface-outline">
      {items.map((item, index) => (
        <DocsAndFilesListItem item={item} testId={`node-${index}`} key={item.id} />
      ))}
    </div>
  );
}

function DocsAndFilesListItem({ item, testId }: { item: DocsAndFiles.Item; testId: string }) {
  const className = classNames(
    "group flex min-h-[72px] items-center gap-3 px-3 py-3",
    "transition-colors hover:bg-surface-dimmed",
  );

  return (
    <div className={className} data-test-id={testId}>
      <DivLink to={item.link} className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
        <DocsAndFilesItemIcon item={item} size={40} />

        <div className="min-w-0 flex-1">
          <div className="truncate text-base font-semibold text-content-base group-hover:text-link-base">{item.name}</div>
          <ItemDetails item={item} />
        </div>
      </DivLink>

      <div className="flex w-10 shrink-0 justify-end">
        <CommentsCountIndicator count={item.commentsCount || 0} size={22} />
      </div>
      {item.menu && <div className="flex w-9 shrink-0 items-center justify-end">{item.menu}</div>}
    </div>
  );
}

function ItemDetails({ item }: { item: DocsAndFiles.Item }) {
  const details = item.details?.filter(Boolean) || [];

  if (details.length < 1) return null;

  return <div className="mt-0.5 truncate text-sm text-content-dimmed">{details.join(" · ")}</div>;
}

function EmptyState({ kind }: { kind: "resourceHub" | "folder" }) {
  const message =
    kind === "folder"
      ? "This folder is empty. Click 'Add' to upload your first file."
      : "Your team's central hub for sharing documents, images, videos, and files. Click 'Add' to get started.";

  return (
    <div className="mt-6 flex w-full items-start gap-4 rounded-md border border-dashed border-surface-outline bg-surface-dimmed px-5 py-5">
      <IconFile size={40} className="shrink-0 text-content-dimmed" />
      <div className="max-w-[56ch]">
        <div className="font-semibold">Ready for your first document</div>
        <div className="mt-1 text-sm text-content-dimmed">{message}</div>
      </div>
    </div>
  );
}

function SortControl({
  sortBy,
  onSortChange,
}: {
  sortBy: DocsAndFiles.SortBy;
  onSortChange: (sortBy: DocsAndFiles.SortBy) => void;
}) {
  const currentOption = DOCS_AND_FILES_SORT_OPTIONS.find((option) => option.value === sortBy);
  const trigger = (
    <button className="flex items-center gap-2 rounded-md border border-surface-outline px-3 py-1.5 text-sm font-medium text-content-dimmed transition-colors hover:bg-surface-dimmed hover:text-content-accent">
      <span>Sort by {currentOption?.label}</span>
      <IconChevronDown size={14} />
    </button>
  );

  return (
    <Menu testId="sort-control" size="tiny" customTrigger={trigger}>
      {DOCS_AND_FILES_SORT_OPTIONS.map((option) => (
        <MenuActionItem key={option.value} onClick={() => onSortChange(option.value)} testId={`sort-option-${option.value}`}>
          <div className="flex items-center justify-between w-full">
            <span>{option.label}</span>
            {sortBy === option.value && <IconCheck size={16} />}
          </div>
        </MenuActionItem>
      ))}
    </Menu>
  );
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
    <div>
      <div className="bg-blue-500 text-white-1 flex items-center justify-center rounded-full" style={style}>
        {count}
      </div>
    </div>
  );
}

function DocsAndFilesNodeIcon({ node, size }: { node: ResourceHubNode; size: number }) {
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

  if (thumbnail && hasNodeContentType(node, "image")) {
    return <Thumbnail thumbnail={thumbnail} size={size} />;
  }

  if (hasNodeContentType(node, "pdf")) return <FileIcon size={size} filetype="pdf" color="bg-red-500" icon={IconAlignJustified} />;
  if (isNodeMovFile(node)) return <FileIcon size={size} filetype="mov" icon={IconVideo} />;
  if (isNodeVideoFile(node)) return <FileIcon size={size} icon={IconVideo} />;
  if (hasNodeContentType(node, "audio")) return <FileIcon size={size} filetype="audio" />;
  if (hasNodeContentType(node, "zip")) return <FileIcon size={size} filetype="zip" icon={IconChartColumn} />;

  return <FileIcon size={size} icon={IconAlignJustified} />;
}

function DocsAndFilesItemIcon({ item, size }: { item: DocsAndFiles.Item; size: number }) {
  if (item.type === "folder") {
    return <IconFolderFilled size={size} className="shrink-0 text-sky-500" />;
  }

  if (item.type === "link") {
    return <FileIcon size={size} icon={IconLink} />;
  }

  if (item.type === "document") {
    return <FileIcon size={size} icon={IconAlignJustified} color="bg-sky-500" />;
  }

  if (item.thumbnail?.url && item.fileKind === "image") {
    return <Thumbnail thumbnail={item.thumbnail} size={size} />;
  }

  switch (item.fileKind) {
    case "pdf":
      return <FileIcon size={size} filetype="pdf" color="bg-red-500" icon={IconAlignJustified} />;
    case "video":
      return <FileIcon size={size} icon={IconVideo} />;
    case "audio":
      return <FileIcon size={size} filetype="audio" />;
    case "zip":
      return <FileIcon size={size} filetype="zip" icon={IconChartColumn} />;
    case "mov":
      return <FileIcon size={size} filetype="mov" icon={IconVideo} />;
    default:
      return <FileIcon size={size} icon={IconAlignJustified} />;
  }
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
    <div style={wrapperStyle} className="flex items-center justify-center relative shrink-0">
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

  return (
    <div className={badgeClass} style={style}>
      {filetype}
    </div>
  );
}

function Thumbnail({ thumbnail, size }: { thumbnail: ThumbnailLike; size: number }) {
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
