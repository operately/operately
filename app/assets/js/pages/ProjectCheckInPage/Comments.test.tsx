/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient } from "@tanstack/react-query";
import { CommentSection } from "turboui";
import { useIsEditMode } from "@/components/Pages";
import { useCommentSection } from "@/features/CommentSection/useCommentSection";
import { invalidateProjectInteractionQueries } from "@/models/projects/projectInteractionQueries";
import { useLoadedData } from "./loader";
import { Comments } from "./Comments";

jest.mock("./loader", () => ({ useLoadedData: jest.fn() }));
jest.mock("@/components/Pages", () => ({ useIsEditMode: jest.fn(() => false) }));
jest.mock("@/features/CommentSection/useCommentSection", () => ({ useCommentSection: jest.fn() }));
jest.mock("@/models/projects/projectInteractionQueries", () => ({
  invalidateProjectInteractionQueries: jest.fn(async () => {}),
}));
jest.mock("turboui", () => ({ CommentSection: jest.fn(() => null) }));

it.each([false, true])("preserves configuration and edit-mode visibility with canComment=%s", async (canComment) => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  jest.clearAllMocks();
  jest.mocked(useIsEditMode).mockReturnValue(false);
  jest.mocked(useLoadedData).mockReturnValue({
    checkIn: {
      id: "resource1",
      project: { id: "project1", permissions: { canComment } },
      acknowledgedAt: "2026-09-10T10:00:00Z",
      acknowledgedBy: { id: "reviewer" },
    },
  } as ReturnType<typeof useLoadedData>);
  const props: NonNullable<ReturnType<typeof useCommentSection>> = {
    items: [],
    canComment,
    currentUser: { id: "me", fullName: "Me", avatarUrl: null, profileLink: "/me" },
    onAddComment: async () => true,
    onEditComment: async () => true,
    richTextHandlers: { mentionedPersonLookup: async () => null },
    formattedTimePreferences: { locale: "en", timezone: "UTC", timeFormat: "automatic" },
  };
  jest.mocked(useCommentSection).mockReturnValue(props);
  const root = createRoot(document.createElement("div"));
  const client = new QueryClient();

  try {
    act(() => root.render(<Comments />));
    const options = jest.mocked(useCommentSection).mock.calls[0]?.[0];
    expect(options).toMatchObject({
      entity: { id: "resource1", type: "project_check_in" },
      mentionSearchScope: { type: "project", id: "project1" },
      canComment,
      acknowledgedAt: "2026-09-10T10:00:00Z",
      acknowledgedBy: { id: "reviewer" },
    });
    expect(jest.mocked(CommentSection).mock.calls[0]?.[0]).toEqual(props);

    for (const mode of ["none", "active"] as const) {
      await options?.invalidateQueries(client, mode);
      expect(invalidateProjectInteractionQueries).toHaveBeenLastCalledWith(
        client,
        expect.objectContaining({
          projectId: "project1",
          resourceId: "resource1",
          resourceType: "project_check_in",
        }),
        mode,
      );
    }

    jest.mocked(CommentSection).mockClear();
    jest.mocked(useIsEditMode).mockReturnValue(true);
    act(() => root.render(<Comments />));
    expect(CommentSection).not.toHaveBeenCalled();
  } finally {
    act(() => root.unmount());
    client.clear();
  }
});
