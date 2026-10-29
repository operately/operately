import type { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";
import type { JSONContent } from "@tiptap/core";
import { DocumentPage, type DocumentInlineCommentsProps } from ".";
import type { InlineThread, Person } from "../ApiTypes";
import { defaultFormattedTimePreferences } from "../FormattedTime";
import { createMockRichEditorHandlers } from "../utils/storybook/richEditor";

const meta = {
  title: "Pages/DocumentPage/InlineComments",
  component: DocumentPage,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof DocumentPage>;
export default meta;
type Story = StoryObj<typeof meta>;

const person: Person = {
  __typename: "person",
  id: "maya",
  fullName: "Maya Chen",
  avatarUrl: null,
  email: "maya@example.com",
  title: "Product lead",
  type: "human",
};
const reviewer: Person = { ...person, id: "sam", fullName: "Sam Rivera" };
const handlers = createMockRichEditorHandlers();
const passage = "Review the launch checklist before Friday.";
const richText = (text: string): JSONContent => ({
  type: "doc",
  content: [{ type: "paragraph", content: [{ type: "text", text }] }],
});
const content = {
  type: "doc",
  content: [
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Launch review" }] },
    ...(richText(passage).content ?? []),
    ...(richText(
      "We are preparing the workspace rollout for the customer success team. Please review the owner assignments and flag anything that might delay the launch.",
    ).content ?? []),
    {
      type: "bulletList",
      content: [
        "Confirm the support handoff.",
        "Share the onboarding guide.",
        "Schedule a follow-up with the pilot team.",
      ].map((text) => ({ type: "listItem", content: richText(text).content })),
    },
  ],
};
const paragraphStart = "Launch review".length + 3;
const now = "2026-10-29T12:00:00Z";
function makeThread(id: string, quote: string, message: string, resolved = false, unattached = false): InlineThread {
  const from = paragraphStart + Math.max(0, passage.indexOf(quote));
  return {
    __typename: "inline_thread",
    id,
    resourceType: "resource_hub_document",
    resourceId: "document",
    author: reviewer,
    resolvedAt: resolved ? now : null,
    resolvedBy: resolved ? person : null,
    insertedAt: now,
    anchor: {
      __typename: "inline_anchor",
      sourceVersion: 1,
      sourceFrom: from,
      sourceTo: from + quote.length,
      quote,
      prefix: "",
      suffix: "",
      currentVersion: 1,
      currentFrom: unattached ? null : from,
      currentTo: unattached ? null : from + quote.length,
      status: unattached ? "unattached" : "attached",
    },
    messages: [
      {
        __typename: "comment",
        id: `message-${id}`,
        author: reviewer,
        content: JSON.stringify(richText(message)),
        insertedAt: now,
        reactions: [],
      },
    ],
  };
}
const initialThreads = [
  makeThread("checklist", "Review the launch checklist", "Could we add a named owner for the support handoff?"),
  makeThread("deadline", "launch checklist before Friday", "Friday works for our team. Is the onboarding guide ready?"),
  makeThread("resolved", "Friday", "The pilot team has confirmed the date.", true),
  makeThread(
    "removed",
    "Send the draft on Wednesday",
    "Keeping this here for reference; the schedule has changed.",
    false,
    true,
  ),
];

function Example({
  empty = false,
  readOnly = false,
  loading = false,
  error = false,
  conflict = false,
  mobile = false,
  ownComment = false,
  inlineCommentsEnabled = true,
}) {
  const [threads, setThreads] = React.useState(() =>
    empty
      ? []
      : initialThreads.map((thread, index) =>
          ownComment && index === 0
            ? {
                ...thread,
                author: person,
                messages: thread.messages.map((message) => ({ ...message, author: person })),
              }
            : thread,
        ),
  );
  const [activeThreadId, setActive] = React.useState<string | null>(
    new URLSearchParams(window.location.search).get("inlineThread"),
  );
  const [version, setVersion] = React.useState(1);
  const [failed, setFailed] = React.useState(error);
  const firstAttempt = React.useRef(conflict);
  const nextId = React.useRef(1);
  const update = (id: string, change: (thread: InlineThread) => InlineThread) =>
    setThreads((threads) => threads.map((thread) => (thread.id === id ? change(thread) : thread)));
  const select = (id: string | null) => {
    setActive(id);
    const url = new URL(window.location.href);
    if (id) url.searchParams.set("inlineThread", id);
    else url.searchParams.delete("inlineThread");
    window.history.replaceState(null, "", url);
  };
  const inlineComments: DocumentInlineCommentsProps = {
    threads,
    documentVersion: version,
    currentUser: { ...person, profileLink: "#" },
    canComment: !readOnly,
    activeThreadId,
    loading,
    error: failed,
    draftKey: "storybook:inline-document",
    richTextHandlers: handlers,
    formattedTimePreferences: defaultFormattedTimePreferences,
    getProfileLink: () => "#",
    onSelectThread: select,
    getThreadLink: (id, messageId) => {
      const url = new URL(window.location.href);
      url.searchParams.set("inlineThread", id);
      url.hash = messageId ?? "";
      return url.toString();
    },
    onReload: async () => setFailed(false),
    onCreate: async (selection, message) => {
      if (firstAttempt.current) {
        firstAttempt.current = false;
        setVersion(2);
        return "conflict";
      }
      const thread = makeThread(`new-${nextId.current++}`, selection.quote, "");
      thread.anchor = {
        ...thread.anchor,
        currentVersion: version,
        sourceVersion: version,
        currentFrom: selection.from,
        sourceFrom: selection.from,
        currentTo: selection.to,
        sourceTo: selection.to,
      };
      thread.messages = [
        {
          __typename: "comment",
          id: `message-${thread.id}`,
          author: person,
          content: JSON.stringify(message),
          insertedAt: now,
          reactions: [],
        },
      ];
      setThreads((threads) => [...threads, thread]);
      select(thread.id);
      return "ok";
    },
    onReply: async (id, message) => {
      update(id, (thread) => ({
        ...thread,
        messages: [
          ...thread.messages,
          {
            __typename: "comment",
            id: `reply-${nextId.current++}`,
            author: person,
            content: JSON.stringify(message),
            insertedAt: now,
            reactions: [],
          },
        ],
      }));
      return true;
    },
    onEditMessage: async (id, content) => {
      setThreads((threads) =>
        threads.map((thread) => ({
          ...thread,
          messages: thread.messages.map((message) =>
            message.id === id ? { ...message, content: JSON.stringify(content) } : message,
          ),
        })),
      );
      return true;
    },
    onDeleteMessage: async (id) => {
      setThreads((threads) =>
        threads
          .map((thread) => ({ ...thread, messages: thread.messages.filter((message) => message.id !== id) }))
          .filter((thread) => thread.messages.length),
      );
    },
    onResolve: async (id, resolved) =>
      update(id, (thread) => ({ ...thread, resolvedAt: resolved ? now : null, resolvedBy: resolved ? person : null })),
  };
  return (
    <div style={mobile ? { maxWidth: 390 } : undefined}>
      <DocumentPage
        pageTitle="Workspace launch"
        title="Workspace launch"
        author={person}
        state="published"
        publishedAt={now}
        formattedTimePreferences={defaultFormattedTimePreferences}
        content={JSON.stringify(content)}
        mentionedPersonLookup={handlers.mentionedPersonLookup}
        taskList={{ canEdit: false }}
        inlineComments={inlineCommentsEnabled ? inlineComments : undefined}
        hideDraftActions
        hideReactions
        hideComments
        hideSubscriptions
        hideCopyModal
        hideDeleteModal
      />
    </div>
  );
}

export const Review: Story = { render: () => <Example /> };
export const Empty: Story = { render: () => <Example empty /> };
export const ReadOnly: Story = { render: () => <Example readOnly /> };
export const Loading: Story = { render: () => <Example loading empty /> };
export const LoadError: Story = { render: () => <Example error /> };
export const VersionConflict: Story = { render: () => <Example conflict /> };
export const Mobile: Story = {
  render: () => <Example mobile />,
  globals: { viewport: { value: "mobile1", isRotated: false } },
};

export const OwnComment: Story = { render: () => <Example ownComment /> };

export const FeatureDisabled: Story = { render: () => <Example inlineCommentsEnabled={false} /> };
