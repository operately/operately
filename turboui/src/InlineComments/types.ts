import type { JSONContent } from "@tiptap/core";
import type { InlineThread } from "../ApiTypes";
import type { Person } from "../CommentSection";
import type { FormattedTimePreferences } from "../FormattedTime";
import type { RichEditorHandlers } from "../RichEditor/useEditor";
import type { InlineCommentSelection } from "../RichEditor/extensions/InlineComments";

export type InlineCommentTarget = InlineCommentSelection & { sourceVersion: number };

export interface DocumentInlineCommentsProps {
  documentVersion: number;
  threads: InlineThread[];
  currentUser: Person;
  canComment: boolean;
  activeThreadId: string | null;
  loading: boolean;
  error: boolean;
  pending?: boolean;
  draftKey: string;
  richTextHandlers: RichEditorHandlers;
  formattedTimePreferences: FormattedTimePreferences;
  getProfileLink: (personId: string) => string;
  getThreadLink: (threadId: string, messageId?: string) => string;
  onSelectThread: (threadId: string | null) => void;
  onReload: () => Promise<unknown>;
  onCreate: (selection: InlineCommentTarget, content: JSONContent) => Promise<"ok" | "conflict" | "error">;
  onReply: (threadId: string, content: JSONContent) => Promise<boolean>;
  onEditMessage: (messageId: string, content: JSONContent) => Promise<boolean>;
  onDeleteMessage: (messageId: string) => Promise<void>;
  onResolve: (threadId: string, resolved: boolean) => Promise<void>;
}

export function attachedRange(thread: InlineThread, version: number) {
  const anchor = thread.anchor;
  if (
    anchor.status !== "attached" ||
    anchor.currentVersion !== version ||
    anchor.currentFrom === null ||
    anchor.currentTo === null
  )
    return null;
  return { id: thread.id, from: anchor.currentFrom, to: anchor.currentTo };
}
