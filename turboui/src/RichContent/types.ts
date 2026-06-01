export type RichTextJSON = {
  type?: string;
  text?: string;
  attrs?: Record<string, unknown>;
  content?: RichTextJSON[];
  marks?: RichTextJSON[];
  [key: string]: unknown;
};
