import {
  EMPTY_DOC,
  defaultSelectedVersionNumber,
  editorLabel,
  eventActionText,
  eventDescription,
  resolveSelection,
  versionPreviewContent,
} from "../types";
import type { DocumentVersion, Person } from "../../ApiTypes";

const person: Person = {
  __typename: "person",
  id: "p1",
  fullName: "Ada Lovelace",
  title: "Engineer",
  avatarUrl: null,
  email: "ada@example.com",
  type: "member",
};

function version(attrs: Partial<DocumentVersion> & Pick<DocumentVersion, "versionNumber">): DocumentVersion {
  return {
    __typename: "document_version",
    id: `v-${attrs.versionNumber}`,
    title: attrs.title ?? "Doc",
    editor: attrs.editor === undefined ? person : attrs.editor,
    origin: attrs.origin ?? "edited",
    restoredFromVersionNumber: attrs.restoredFromVersionNumber ?? null,
    insertedAt: "2026-07-21T12:00:00Z",
    isCurrent: attrs.isCurrent ?? false,
    titleChanged: attrs.titleChanged ?? false,
    contentChanged: attrs.contentChanged ?? false,
    ...attrs,
  };
}

describe("resolveSelection", () => {
  const versions = [
    version({ versionNumber: 3, isCurrent: true }),
    version({ versionNumber: 2 }),
    version({ versionNumber: 1, origin: "created" }),
  ];

  test("selects route version against its predecessor", () => {
    expect(resolveSelection(versions, 2)).toEqual({ selected: 2, before: 1, after: 2 });
  });

  test("version 1 has no before", () => {
    expect(resolveSelection(versions, 1)).toEqual({ selected: 1, before: null, after: 1 });
  });
});

describe("defaultSelectedVersionNumber", () => {
  test("prefers the current version", () => {
    expect(
      defaultSelectedVersionNumber([
        version({ versionNumber: 3 }),
        version({ versionNumber: 2, isCurrent: true }),
        version({ versionNumber: 1, origin: "created" }),
      ]),
    ).toBe(2);
  });

  test("returns null for an empty versions array", () => {
    expect(defaultSelectedVersionNumber([])).toBeNull();
  });

  test("selects the newest version when no current version is present", () => {
    expect(
      defaultSelectedVersionNumber([
        version({ versionNumber: 1, origin: "created" }),
        version({ versionNumber: 3 }),
        version({ versionNumber: 2 }),
      ]),
    ).toBe(3);
  });
});

describe("versionPreviewContent", () => {
  test("returns content when present", () => {
    const content = {
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "Example" }] }],
    };

    expect(versionPreviewContent(version({ versionNumber: 1, content: content as DocumentVersion["content"] }))).toEqual(
      content,
    );
  });

  test("returns EMPTY_DOC when version has null or undefined content", () => {
    expect(versionPreviewContent(version({ versionNumber: 1, content: null }))).toEqual(EMPTY_DOC);
    expect(versionPreviewContent(version({ versionNumber: 1, content: undefined }))).toEqual(EMPTY_DOC);
  });

  test("returns EMPTY_DOC when version is null or undefined", () => {
    expect(versionPreviewContent(null)).toEqual(EMPTY_DOC);
    expect(versionPreviewContent(undefined)).toEqual(EMPTY_DOC);
  });
});

describe("event copy", () => {
  test("describes create, edit, title change, and restore", () => {
    const created = version({ versionNumber: 1, origin: "created", title: "A" });
    const edited = version({
      versionNumber: 2,
      origin: "edited",
      title: "A",
      contentChanged: true,
    });
    const renamed = version({
      versionNumber: 3,
      origin: "edited",
      title: "B",
      titleChanged: true,
      contentChanged: false,
    });
    const titleAndContent = version({
      versionNumber: 4,
      origin: "edited",
      title: "C",
      titleChanged: true,
      contentChanged: true,
    });
    const restored = version({
      versionNumber: 5,
      origin: "restored",
      restoredFromVersionNumber: 1,
      title: "B",
    });

    expect(eventActionText(created, null)).toBe("created this document");
    expect(eventActionText(edited, created)).toBe("updated this document");
    expect(eventActionText(renamed, edited)).toBe(
      "changed the title of this document from “A” to “B”",
    );
    expect(eventActionText(titleAndContent, renamed)).toBe("updated this document");
    expect(eventActionText(restored, titleAndContent)).toContain("restored this document from Version 1");
    expect(eventDescription(created, null)).toBe("Ada Lovelace created this document");
    expect(eventDescription(edited, created)).toBe("Ada Lovelace updated this document");
    expect(editorLabel(version({ versionNumber: 1, editor: null }))).toBe("Former member");

    const migrated = version({ versionNumber: 1, origin: "migration", editor: null });
    expect(eventActionText(migrated, null)).toBe("created this document");
    expect(eventDescription(migrated, null)).toBe("Former member created this document");
  });
});
