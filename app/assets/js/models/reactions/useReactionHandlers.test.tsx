/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import i18n from "@/i18n";
import { showErrorToast } from "turboui";
import { useReactionHandlers } from "./useReactionHandlers";

const create = jest.fn();
const remove = jest.fn();
jest.mock("./reactionLifecycle", () => ({
  useCreateReaction: () => ({ mutateAsync: create }),
  useDeleteReaction: () => ({ mutateAsync: remove }),
}));
jest.mock("@/routes/paths", () => ({ compareIds: (a: string, b: string) => a === b }));
jest.mock("@/contexts/CurrentCompanyContext", () => ({ useMe: () => ({ id: "me", fullName: "Me" }) }));
jest.mock("turboui", () => ({ showErrorToast: jest.fn() }));

type Comment = { id: string; content: string; reactions: { id: string; emoji: string }[] };
const refresh = jest.fn();
let comments: Comment[];
let handlers: ReturnType<typeof useReactionHandlers<Comment>>;

function Harness() {
  const [current, setComments] = React.useState<Comment[]>([
    { id: "comment", content: "Literal content", reactions: [] },
  ]);
  comments = current;
  handlers = useReactionHandlers(setComments, "project_task", refresh);
  return null;
}

it("uses reaction mutations, rolls back failed writes, and translates their feedback", async () => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  const root = createRoot(document.createElement("div"));
  await i18n.changeLanguage("pt-BR");
  try {
    await act(async () => root.render(<Harness />));
    create.mockRejectedValueOnce(new Error("write failed"));
    await act(async () => {
      await handlers.handleAddReaction("comment", "👍");
    });
    expect(create).toHaveBeenCalledWith({
      entityId: "comment",
      entityType: "comment",
      parentType: "project_task",
      emoji: "👍",
    });
    expect(comments[0]?.reactions).toEqual([]);
    expect(showErrorToast).toHaveBeenLastCalledWith("Erro", "Falha ao adicionar a reação.");
    expect(refresh).not.toHaveBeenCalled();

    create.mockResolvedValueOnce({});
    await act(async () => {
      await handlers.handleAddReaction("comment", "👍");
    });
    const reactionId = comments[0]?.reactions[0]?.id;
    if (!reactionId) throw new Error("Expected optimistic reaction");
    let rejectRemoval: (error: Error) => void = () => {};
    remove.mockImplementationOnce(
      () =>
        new Promise((_resolve, reject) => {
          rejectRemoval = reject;
        }),
    );
    let removal: Promise<void> = Promise.resolve();
    act(() => {
      removal = handlers.handleRemoveReaction("comment", reactionId);
    });
    expect(comments[0]?.reactions).toEqual([]);
    await act(async () => {
      rejectRemoval(new Error("delete failed"));
      await removal;
    });
    expect(remove).toHaveBeenCalledWith({ reactionId });
    expect(comments[0]?.reactions[0]?.id).toBe(reactionId);
    expect(comments[0]?.content).toBe("Literal content");
    expect(showErrorToast).toHaveBeenLastCalledWith("Erro", "Falha ao remover a reação.");
    expect(refresh).toHaveBeenCalledTimes(1);
  } finally {
    await act(async () => root.unmount());
    await i18n.changeLanguage("en");
  }
});
