import type { JSONContent } from "@tiptap/core";

import type { DocumentVersion, Person } from "../ApiTypes";
import * as F from "../RichContentDiff/__tests__/fixtures";

import type { VersionSnapshot } from "./types";

const bob: Person = {
  __typename: "person",
  id: "bob_williams",
  fullName: "Bob Williams",
  title: "Engineer",
  avatarUrl: null,
  email: "bob@example.com",
  type: "member",
};

const grace: Person = {
  __typename: "person",
  id: "grace_wilson",
  fullName: "Grace Wilson",
  title: "Designer",
  avatarUrl: null,
  email: "grace@example.com",
  type: "member",
};

function version(
  attrs: Omit<Partial<DocumentVersion>, "content"> &
    Pick<DocumentVersion, "versionNumber" | "title" | "origin"> & {
      // API Json is string; mocks pass TipTap JSON objects.
      content?: JSONContent | null;
    },
): DocumentVersion {
  return {
    __typename: "document_version",
    id: `ver-${attrs.versionNumber}`,
    editor: attrs.editor ?? bob,
    restoredFromVersionNumber: attrs.restoredFromVersionNumber ?? null,
    insertedAt: attrs.insertedAt ?? `2026-07-21T14:${String(attrs.versionNumber).padStart(2, "0")}:00Z`,
    isCurrent: attrs.isCurrent ?? false,
    titleChanged: attrs.titleChanged ?? false,
    contentChanged: attrs.contentChanged ?? false,
    ...attrs,
    content: attrs.content as DocumentVersion["content"],
  };
}

export const titles = {
  original: "Writing guide for Docs & Files",
  renamed: "Docs & Files writing principles",
  current: "How we write Docs & Files pages",
  oneVersion: "Getting started with Docs & Files",
} as const;

/** History page breadcrumbs end at the document. */
export function navigationFor(documentTitle: string) {
  return [
    { to: "/spaces/1", label: "Product" },
    { to: "/resource-hubs/1", label: "Documents & Files" },
    { to: "/documents/1", label: documentTitle },
  ];
}

/** Comparison page breadcrumbs include a link back to history. */
export function comparisonNavigationFor(documentTitle: string) {
  return [
    ...navigationFor(documentTitle),
    { to: "/documents/1/versions", label: "History of changes" },
  ];
}

/** Default breadcrumb for the current multi-version document (history page). */
export const navigation = navigationFor(titles.current);

/** Default breadcrumb for comparison stories. */
export const comparisonNavigation = comparisonNavigationFor(titles.current);

/** Realistic multi-section body for history preview / first-version stories. */
export const contentV1 = F.doc(
  F.heading(2, F.text("Overview")),
  F.paragraph(
    F.text(
      "This document captures the product principles we use when shipping Docs & Files. Keep it short enough to read in one sitting, but concrete enough that a new teammate can make the same judgment calls without asking in chat.",
    ),
  ),
  F.heading(2, F.text("What good looks like")),
  F.paragraph(
    F.text(
      "A resource hub should feel like a shared workspace, not a dump of attachments. Titles are searchable, folders stay shallow, and every published page answers a real question someone on the team will ask again next quarter.",
    ),
  ),
  F.bulletList(
    F.listItem(F.paragraph(F.text("Prefer one canonical page over three overlapping drafts."))),
    F.listItem(F.paragraph(F.text("Link out to projects and goals instead of copying status into the doc."))),
    F.listItem(F.paragraph(F.text("Call out owners in the intro so readers know who to ping."))),
  ),
  F.heading(2, F.text("Writing checklist")),
  F.paragraph(
    F.text(
      "Before you publish, skim for jargon, confirm screenshots still match the UI, and make sure the first paragraph states the decision or outcome. If the page is longer than a few screens, add headings so people can jump to the section they need.",
    ),
  ),
  F.heading(2, F.text("Open questions")),
  F.paragraph(
    F.text(
      "We still need a clearer rule for when a page should live in the company hub versus a project folder. Until then, default to the project when the audience is the delivery team, and promote to the hub when more than one space needs the same source of truth.",
    ),
  ),
);

/** Later revision of the same doc — small, visible body edits for comparison stories. */
export const contentV2 = F.doc(
  F.heading(2, F.text("Overview")),
  F.paragraph(
    F.text(
      "This document captures the product principles we use when shipping Docs & Files. Keep it short enough to read in one sitting, but concrete enough that a new teammate can make the same judgment calls without asking in chat.",
    ),
  ),
  F.heading(2, F.text("What good looks like")),
  F.paragraph(
    F.text(
      "A resource hub should feel like a shared workspace, not a dump of attachments. Titles are searchable, folders stay shallow, and every published page answers a real question someone on the team will ask again next quarter. When in doubt, edit the existing page instead of starting a parallel one.",
    ),
  ),
  F.bulletList(
    F.listItem(F.paragraph(F.text("Prefer one canonical page over three overlapping drafts."))),
    F.listItem(F.paragraph(F.text("Link out to projects and goals instead of copying status into the doc."))),
    F.listItem(F.paragraph(F.text("Call out owners in the intro so readers know who to ping."))),
    F.listItem(F.paragraph(F.text("Archive outdated pages rather than leaving stale advice in place."))),
  ),
  F.heading(2, F.text("Writing checklist")),
  F.paragraph(
    F.text(
      "Before you publish, skim for jargon, confirm screenshots still match the UI, and make sure the first paragraph states the decision or outcome. If the page is longer than a few screens, add headings so people can jump to the section they need.",
    ),
  ),
  F.heading(2, F.text("Open questions")),
  F.paragraph(
    F.text(
      "We still need a clearer rule for when a page should live in the company hub versus a project folder. Until then, default to the project when the audience is the delivery team, and promote to the hub when more than one space needs the same source of truth.",
    ),
  ),
  F.paragraph(
    F.text(
      "Brand new line: also document who owns the promotion decision so pages do not linger in project folders forever.",
    ),
  ),
);

export const contentTitleOnly = contentV1;
export const contentFormatted = F.marksAfter;
export const contentHeading = F.paragraphToHeadingAfter;
export const contentMentionBlob = F.doc(
  F.paragraph(F.text("Reviewed by "), F.mention("grace_wilson", "Grace Wilson"), F.text(".")),
  F.paragraph(F.blob({ id: "blob-2", alt: "New caption", filetype: "image/png" })),
);
export const contentMentionBlobBefore = F.doc(
  F.paragraph(F.text("Reviewed by "), F.mention("bob_williams", "Bob Williams"), F.text(".")),
  F.paragraph(F.blob({ id: "blob-1", alt: "Old caption", filetype: "image/png" })),
);
export const contentLong = F.buildLargeDocumentShowcasePair(20);

export const oneVersionList: DocumentVersion[] = [
  version({
    versionNumber: 1,
    title: titles.oneVersion,
    origin: "created",
    isCurrent: true,
    editor: bob,
    content: contentV1,
  }),
];

export const migrationBaselineList: DocumentVersion[] = [
  version({
    versionNumber: 2,
    title: titles.current,
    origin: "edited",
    isCurrent: true,
    editor: grace,
    titleChanged: true,
    contentChanged: true,
    content: contentV2,
  }),
  version({
    versionNumber: 1,
    title: titles.original,
    origin: "migration",
    editor: null,
    content: contentV1,
  }),
];

export const multiVersionList: DocumentVersion[] = [
  version({
    versionNumber: 5,
    title: titles.current,
    origin: "edited",
    isCurrent: true,
    editor: grace,
    titleChanged: true,
    contentChanged: true,
    content: contentV2,
  }),
  version({
    versionNumber: 4,
    title: titles.renamed,
    origin: "edited",
    editor: bob,
    titleChanged: true,
    contentChanged: false,
    content: contentTitleOnly,
  }),
  version({
    versionNumber: 3,
    title: titles.original,
    origin: "restored",
    restoredFromVersionNumber: 1,
    editor: bob,
    content: contentV1,
  }),
  version({
    versionNumber: 2,
    title: titles.original,
    origin: "edited",
    editor: bob,
    titleChanged: false,
    contentChanged: true,
    content: contentV1,
  }),
  version({
    versionNumber: 1,
    title: titles.original,
    origin: "created",
    editor: bob,
    content: contentV1,
  }),
];

export function snapshot(versionNumber: number, title: string, content: unknown): VersionSnapshot {
  return { versionNumber, title, content };
}
