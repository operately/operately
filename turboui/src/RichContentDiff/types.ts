export type RichContentChangeKind = "addition" | "deletion" | "replacement";

export type RichContentChange = {
  kind: RichContentChangeKind;
  /** Range in the before document (inclusive start, exclusive end). */
  fromA: number;
  toA: number;
  /** Range in the after document (inclusive start, exclusive end). */
  fromB: number;
  toB: number;
};

export type DiffRichContentSuccess = {
  ok: true;
  changes: RichContentChange[];
};

export type DiffRichContentFailure = {
  ok: false;
  error: "parse_error";
};

export type DiffRichContentResult = DiffRichContentSuccess | DiffRichContentFailure;
