/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Reaction } from "@/api";
import { Reactions } from "turboui";
import { useOptimisticReactions } from "@/models/reactions/useOptimisticReactions";
import { invalidateProjectInteractionQueries } from "@/models/projects/projectInteractionQueries";
import { useLoadedData } from "./loader";
import { ActivityReactions } from "./ActivityReactions";

jest.mock("./loader", () => ({ useLoadedData: jest.fn() }));
jest.mock("@/models/reactions/useOptimisticReactions", () => ({ useOptimisticReactions: jest.fn() }));
jest.mock("@/models/projects/projectInteractionQueries", () => ({ invalidateProjectInteractionQueries: jest.fn() }));
jest.mock("turboui", () => ({ Reactions: jest.fn(() => null) }));

it.each(["thread", "reactions", "permissions"] as const)(
  "hides unavailable %s and recovers when data arrives",
  (missing) => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    jest.clearAllMocks();
    const loaded = {
      activity: {
        id: "activity1",
        commentThread:
          missing === "thread" ? null : { id: "resource1", reactions: missing === "reactions" ? null : [] },
        permissions: missing === "permissions" ? null : { canCommentOnThread: true },
      },
      project: { id: "project1" },
    } as ReturnType<typeof useLoadedData>;
    jest.mocked(useLoadedData).mockReturnValue(loaded);
    jest.mocked(useOptimisticReactions).mockReturnValue({
      reactions: [],
      currentPersonId: "me",
      onAddReaction: jest.fn(),
      onRemoveReaction: jest.fn(),
    });
    const client = new QueryClient();
    const root = createRoot(document.createElement("div"));
    const render = () =>
      act(() =>
        root.render(
          <QueryClientProvider client={client}>
            <ActivityReactions />
          </QueryClientProvider>,
        ),
      );

    try {
      render();
      expect(useOptimisticReactions).not.toHaveBeenCalled();
      expect(Reactions).not.toHaveBeenCalled();

      loaded.activity.commentThread = {
        __typename: "comment_thread",
        id: "resource1",
        insertedAt: "2026-09-21T10:00:00Z",
        title: null,
        message: null,
        reactions: [],
      };
      loaded.activity.permissions = { __typename: "activity_permissions", canCommentOnThread: true };
      render();
      expect(Reactions).toHaveBeenCalled();
    } finally {
      act(() => root.unmount());
      client.clear();
    }
  },
);

it.each([false, true])(
  "uses current query reactions and awaits scoped refresh with canComment=%s",
  async (canComment) => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    jest.clearAllMocks();
    const reactions: Reaction[] = [{ __typename: "reaction", id: "reaction1", emoji: "👍", person: null }];
    const loaded = {
      activity: {
        id: "activity1",
        commentThread: { id: "resource1", reactions },
        permissions: { canCommentOnThread: canComment },
      },
      project: { id: "project1" },
    } as ReturnType<typeof useLoadedData>;
    jest.mocked(useLoadedData).mockReturnValue(loaded);
    const form = {
      reactions: [],
      currentPersonId: "me",
      onAddReaction: jest.fn(),
      onRemoveReaction: jest.fn(),
    };
    jest.mocked(useOptimisticReactions).mockReturnValue(form);
    const client = new QueryClient();
    const root = createRoot(document.createElement("div"));
    const render = () =>
      act(() =>
        root.render(
          <QueryClientProvider client={client}>
            <ActivityReactions />
          </QueryClientProvider>,
        ),
      );

    try {
      render();
      const options = jest.mocked(useOptimisticReactions).mock.calls.at(-1)?.[0];
      expect(options).toMatchObject({
        entity: { id: "resource1", type: "project_discussion" },
        initialReactions: reactions,
      });
      expect(jest.mocked(Reactions).mock.calls.at(-1)?.[0]).toEqual({ ...form, size: 24, canAddReaction: canComment });

      let finishRefresh: () => void = () => {};
      const refresh = new Promise<void>((resolve) => {
        finishRefresh = resolve;
      });
      jest.mocked(invalidateProjectInteractionQueries).mockReturnValueOnce(refresh);
      expect(options?.onRefresh()).toBe(refresh);
      expect(invalidateProjectInteractionQueries).toHaveBeenCalledWith(
        client,
        expect.objectContaining({
          projectId: "project1",
          resourceId: "resource1",
          resourceType: "project_discussion",
          activityId: "activity1",
        }),
      );
      finishRefresh();
      await refresh;

      if (!loaded.activity.commentThread) throw new Error("Missing test thread");

      loaded.activity.commentThread.reactions = [
        { __typename: "reaction", id: "reaction2", emoji: "🎉", person: null },
      ];
      render();
      expect(jest.mocked(useOptimisticReactions).mock.calls.at(-1)?.[0].initialReactions).toEqual(
        loaded.activity.commentThread.reactions,
      );
    } finally {
      act(() => root.unmount());
      client.clear();
    }
  },
);
