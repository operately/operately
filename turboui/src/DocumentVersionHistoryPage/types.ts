import type { JSONContent } from "@tiptap/core";

import type { DocumentVersion } from "../ApiTypes";
import type { FormattedTimePreferences } from "../FormattedTime";
import type { MentionedPersonLookupFn } from "../RichEditor/useEditor";
import type { Page } from "../Page";

export type ComparisonStatus = "idle" | "loading" | "error" | "ready";

export type VersionSnapshot = {
  versionNumber: number;
  title: string;
  content: unknown;
  insertedAt?: string;
};

export type DocumentVersionHistoryPageProps = {
  title: Page.Props["title"];
  navigation: NonNullable<Page.Props["navigation"]>;
  versions: DocumentVersion[];
  formattedTimePreferences: FormattedTimePreferences;
  mentionedPersonLookup: MentionedPersonLookupFn;
  getComparisonPath: (versionNumber: number) => string;
};

export const EMPTY_DOC: JSONContent = { type: "doc", content: [] };

export function sortVersionsNewestFirst(versions: DocumentVersion[]): DocumentVersion[] {
  return [...versions].sort((a, b) => b.versionNumber - a.versionNumber);
}

export function sortVersionsOldestFirst(versions: DocumentVersion[]): DocumentVersion[] {
  return [...versions].sort((a, b) => a.versionNumber - b.versionNumber);
}

/** Default preview selection: canonical/latest version, else newest. */
export function defaultSelectedVersionNumber(versions: DocumentVersion[]): number | null {
  if (versions.length === 0) return null;
  const newestFirst = sortVersionsNewestFirst(versions);
  return (newestFirst.find((v) => v.isCurrent) ?? newestFirst[0]!).versionNumber;
}

/**
 * Preview body for the history page.
 * API `Json` is typed as string; runtime TipTap content is an object.
 */
export function versionPreviewContent(version: DocumentVersion | null | undefined): JSONContent {
  return (version?.content as JSONContent | null | undefined) ?? EMPTY_DOC;
}

/**
 * Default selection for comparison routes.
 * - route version n → n vs n-1 (version 1 has no before)
 */
export function resolveSelection(
  versions: DocumentVersion[],
  routeVersionNumber?: number | null,
): { selected: number | null; before: number | null; after: number | null } {
  if (versions.length === 0) {
    return { selected: null, before: null, after: null };
  }

  const newestFirst = sortVersionsNewestFirst(versions);
  const numbers = new Set(versions.map((v) => v.versionNumber));
  const current = newestFirst.find((v) => v.isCurrent) ?? newestFirst[0]!;

  let after = routeVersionNumber ?? current.versionNumber;
  if (!numbers.has(after)) {
    after = current.versionNumber;
  }

  const before = after > 1 && numbers.has(after - 1) ? after - 1 : null;

  return { selected: after, before, after };
}

export function editorLabel(version: DocumentVersion): string {
  if (!version.editor) return "Former member";
  return version.editor.fullName || "Former member";
}

/** Previous version in number order (n-1), from a newest-first list. */
export function previousVersion(
  versionsNewestFirst: DocumentVersion[],
  version: DocumentVersion,
): DocumentVersion | null {
  return versionsNewestFirst.find((candidate) => candidate.versionNumber === version.versionNumber - 1) ?? null;
}

/** Action text after the editor name. */
export function eventActionText(version: DocumentVersion, previous: DocumentVersion | null): string {
  if (version.origin === "created" || version.versionNumber === 1) {
    return "created this document";
  }

  if (version.origin === "restored" && version.restoredFromVersionNumber) {
    return `restored this document from Version ${version.restoredFromVersionNumber}`;
  }

  if (version.titleChanged && !version.contentChanged && previous) {
    return `changed the title of this document from “${previous.title}” to “${version.title}”`;
  }

  return "updated this document";
}

export function eventDescription(version: DocumentVersion, previous: DocumentVersion | null = null): string {
  return `${editorLabel(version)} ${eventActionText(version, previous)}`;
}
