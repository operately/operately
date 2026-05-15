import { clearLocalDraft, hasLocalDraft, isRichTextEmpty, readLocalDraft, writeLocalDraft } from "./localDrafts";

const emptyDoc = { type: "doc", content: [{ type: "paragraph" }] };
const baseDoc = { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Original" }] }] };
const draftDoc = { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Draft" }] }] };

describe("local rich text drafts", () => {
  beforeEach(() => {
    window.localStorage.clear();
    jest.spyOn(Date, "now").mockReturnValue(1_000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("restores a draft when it was based on the current content", () => {
    writeLocalDraft({ key: "task:1:description" }, draftDoc, baseDoc);

    expect(readLocalDraft({ key: "task:1:description" }, baseDoc)).toEqual(draftDoc);
  });

  it("restores a draft for editors that started without content", () => {
    writeLocalDraft({ key: "discussion:1:new-comment" }, draftDoc, undefined);

    expect(readLocalDraft({ key: "discussion:1:new-comment" }, undefined)).toEqual(draftDoc);
    expect(hasLocalDraft({ key: "discussion:1:new-comment" }, undefined)).toBe(true);
  });

  it("does not restore a draft when the base content changed", () => {
    writeLocalDraft({ key: "task:1:description" }, draftDoc, baseDoc);

    const changedBase = { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Changed" }] }] };

    expect(readLocalDraft({ key: "task:1:description" }, changedBase)).toBeNull();
  });

  it("removes drafts that match the base content or are empty", () => {
    writeLocalDraft({ key: "task:1:description" }, draftDoc, baseDoc);
    writeLocalDraft({ key: "task:1:description" }, baseDoc, baseDoc);

    expect(readLocalDraft({ key: "task:1:description" }, baseDoc)).toBeNull();

    writeLocalDraft({ key: "task:1:description" }, draftDoc, baseDoc);
    writeLocalDraft({ key: "task:1:description" }, emptyDoc, baseDoc);

    expect(readLocalDraft({ key: "task:1:description" }, baseDoc)).toBeNull();
  });

  it("expires old drafts", () => {
    writeLocalDraft({ key: "task:1:description" }, draftDoc, baseDoc);

    jest.spyOn(Date, "now").mockReturnValue(3_000);

    expect(readLocalDraft({ key: "task:1:description", ttlMs: 1_000 }, baseDoc)).toBeNull();
  });

  it("clears a draft explicitly", () => {
    writeLocalDraft({ key: "task:1:description" }, draftDoc, baseDoc);
    clearLocalDraft({ key: "task:1:description" });

    expect(readLocalDraft({ key: "task:1:description" }, baseDoc)).toBeNull();
  });

  it("treats blank rich text documents as empty", () => {
    expect(isRichTextEmpty(emptyDoc)).toBe(true);
    expect(isRichTextEmpty(draftDoc)).toBe(false);
  });
});
