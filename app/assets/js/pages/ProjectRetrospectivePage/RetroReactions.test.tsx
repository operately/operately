/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Reaction } from "@/api";
import { Reactions } from "turboui";
import { useOptimisticReactions } from "@/models/reactions/useOptimisticReactions";
import { invalidateProjectInteractionQueries } from "@/models/projects/projectInteractionQueries";
import { useLoadedData } from "./loader";
import { RetroReactions } from "./RetroReactions";

jest.mock("./loader", () => ({ useLoadedData: jest.fn() }));
jest.mock("@/models/reactions/useOptimisticReactions", () => ({ useOptimisticReactions: jest.fn() }));
jest.mock("@/models/projects/projectInteractionQueries", () => ({ invalidateProjectInteractionQueries: jest.fn() }));
jest.mock("turboui", () => ({ Reactions: jest.fn(() => null) }));

it.each([false, true])(
  "uses current query reactions and awaits scoped refresh with canComment=%s",
  async (canComment) => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    jest.clearAllMocks();
    const reactions: Reaction[] = [{ __typename: "reaction", id: "reaction1", emoji: "👍", person: null }];
    const loaded = {
      retrospective: { id: "resource1", reactions, project: { id: "project1" }, permissions: { canComment } },
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
            <RetroReactions />
          </QueryClientProvider>,
        ),
      );

    try {
      render();
      const options = jest.mocked(useOptimisticReactions).mock.calls.at(-1)?.[0];
      expect(options).toMatchObject({
        entity: { id: "resource1", type: "project_retrospective" },
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
          resourceType: "project_retrospective",
        }),
      );
      finishRefresh();
      await refresh;

      loaded.retrospective.reactions = [{ __typename: "reaction", id: "reaction2", emoji: "🎉", person: null }];
      render();
      expect(jest.mocked(useOptimisticReactions).mock.calls.at(-1)?.[0].initialReactions).toEqual(
        loaded.retrospective.reactions,
      );
    } finally {
      act(() => root.unmount());
      client.clear();
    }
  },
);
