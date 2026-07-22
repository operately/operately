import { editorLabel, eventActionLabel, eventActionText, eventDescription, resolveSelection } from "../types";
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

describe("event copy", () => {
  test("describes create, edit, title change, and restore", () => {
    const created = version({ versionNumber: 1, origin: "created", title: "A" });
    const edited = version({ versionNumber: 2, origin: "edited", title: "A" });
    const renamed = version({ versionNumber: 3, origin: "edited", title: "B" });
    const restored = version({
      versionNumber: 4,
      origin: "restored",
      restoredFromVersionNumber: 1,
      title: "B",
    });

    expect(eventActionText(created, null)).toBe("created this document");
    expect(eventActionText(edited, created)).toBe("saved a new version of this document");
    expect(eventActionText(renamed, edited)).toContain("changed the title");
    expect(eventActionText(restored, renamed)).toContain("restored this document from Version 1");
    expect(eventDescription(created, null)).toBe("Ada Lovelace created this document");
    expect(eventDescription(edited, created)).toBe("Ada Lovelace saved a new version of this document");
    expect(eventActionLabel(created)).toBe("View this version");
    expect(eventActionLabel(edited)).toBe("See what changed");
    expect(editorLabel(version({ versionNumber: 1, editor: null }))).toBe("Former member");

    const migrated = version({ versionNumber: 1, origin: "migration", editor: null });
    expect(eventActionText(migrated, null)).toBe("created this document");
    expect(eventDescription(migrated, null)).toBe("Former member created this document");
  });
});
