/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React, { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Api, { Comment, Person } from "@/api";
import { showErrorToast } from "turboui";
import { useOptimisticComments } from "./useOptimisticComments";

jest.mock("@/contexts/CurrentCompanyContext", () => ({ useMe: () => ({ id: "me", fullName: "Me" }) }));
jest.mock("turboui", () => ({ showErrorToast: jest.fn() }));

const person = { id: "me", fullName: "Me" } as Person;
const comment = (id: string, content = id): Comment => ({
  __typename: "comment",
  id,
  content,
  author: person,
  reactions: [],
});
const reaction = { __typename: "reaction" as const, id: "reaction-1", emoji: "👍", person };

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

describe("useOptimisticComments", () => {
  let root: Root;
  let container: HTMLDivElement;
  let client: QueryClient;
  let hook: ReturnType<typeof useOptimisticComments>;
  let props: Parameters<typeof useOptimisticComments>[0];
  let serverComments: Comment[];
  let create: jest.Mock;
  let update: jest.Mock;
  let remove: jest.Mock;
  let createReaction: jest.Mock;
  let deleteReaction: jest.Mock;

  function Harness() {
    hook = useOptimisticComments(props);
    return null;
  }
  async function render(changes = {}) {
    props = { ...props, ...changes };
    await act(async () => {
      root.render(
        <React.StrictMode>
          <QueryClientProvider client={client}>
            <Harness />
          </QueryClientProvider>
        </React.StrictMode>,
      );
    });
  }
  async function start<T>(run: () => Promise<T>) {
    let result: Promise<T> = Promise.resolve(undefined as T);
    await act(async () => {
      result = run();
    });
    return { result };
  }

  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    Api.default.setBasePath("/api/v2");
    Api.default.setHeaders({ "x-company-id": "company-1" });
    client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    container = document.createElement("div");
    root = createRoot(container);
    serverComments = [comment("one"), comment("two")];
    props = { taskId: "task-1", parentType: "project_task", initialComments: serverComments };
    create = jest.fn();
    update = jest.fn();
    remove = jest.fn();
    createReaction = jest.fn();
    deleteReaction = jest.fn();
    for (const [namespace, method, fn] of [
      [Api.comments, "create", create],
      [Api.comments, "update", update],
      [Api.comments, "delete", remove],
      [Api.reactions, "create", createReaction],
      [Api.reactions, "delete", deleteReaction],
    ] as const) {
      jest.spyOn(namespace as any, method).mockImplementation(fn);
      jest.spyOn(namespace as any, `${method}MutationOptions`).mockReturnValue({ mutationFn: fn });
    }
    const options = Api.comments.listQueryOptions;
    jest.spyOn(Api.comments, "listQueryOptions").mockImplementation((input) => ({
      ...options(input),
      queryFn: async () => ({ comments: serverComments }),
    }));
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    client.clear();
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it("keeps an optimistic create through a stale refresh and replaces it once", async () => {
    const request = deferred<{ comment: Comment }>();
    create.mockReturnValue(request.promise);
    await render();
    const pending = await start(() => hook.addComment({ text: "new" }));
    expect(hook.comments).toHaveLength(3);
    await render({ initialComments: [...serverComments] });
    expect(hook.comments[0]?.id).toMatch(/^temp-/);
    serverComments = [comment("saved", JSON.stringify({ text: "new" })), ...serverComments];
    await act(async () => {
      request.resolve({ comment: serverComments[0] as Comment });
      await pending.result;
    });
    expect(hook.comments.map((c) => c.id)).toEqual(["saved", "one", "two"]);
    expect(client.getMutationCache().getAll()).toHaveLength(1);
  });

  it("rolls back failed deletion in its original position without losing a queued edit", async () => {
    const request = deferred<{ comment: Comment }>();
    remove.mockReturnValue(request.promise);
    update.mockImplementation(async () => {
      serverComments = [comment("one", '"edited"'), comment("two")];
      return { comment: serverComments[0] };
    });
    await render();
    const deletion = await start(() => hook.deleteComment("two"));
    const edit = await start(() => hook.editComment("one", "edited"));
    expect(hook.comments.map((c) => c.content)).toEqual(['"edited"']);
    await act(async () => {
      request.reject(new Error("offline"));
      await deletion.result;
      await edit.result;
    });
    expect(hook.comments.map((c) => c.id)).toEqual(["one", "two"]);
    expect(hook.comments[0]?.content).toBe('"edited"');
  });

  it("serializes edits and restores confirmed content when overlapping edits both fail", async () => {
    const first = deferred<{ comment: Comment }>();
    const second = deferred<{ comment: Comment }>();
    update.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    await render();
    const a = await start(() => hook.editComment("one", "first"));
    const b = await start(() => hook.editComment("one", "second"));
    expect(update).toHaveBeenCalledTimes(1);
    expect(hook.comments[0]?.content).toBe('"second"');
    await act(async () => {
      first.reject(new Error("first failed"));
      await a.result;
    });
    expect(hook.comments[0]?.content).toBe('"second"');
    await act(async () => {
      second.reject(new Error("second failed"));
      await b.result;
    });
    expect(hook.comments[0]?.content).toBe("one");
  });

  it("restores a failed reaction removal only on its original comment", async () => {
    props.initialComments = [{ ...comment("one"), reactions: [reaction] }, comment("two")];
    const request = deferred<unknown>();
    deleteReaction.mockReturnValue(request.promise);
    await render();
    const pending = await start(() => hook.removeReaction("one", reaction.id));
    expect(hook.comments[0]?.reactions).toEqual([]);
    await act(async () => {
      request.reject(new Error("offline"));
      await pending.result;
    });
    expect(hook.comments[0]?.reactions).toEqual([reaction]);
    expect(hook.comments[1]?.reactions).toEqual([]);
  });

  it("persists removing a reaction while its creation is pending", async () => {
    const request = deferred<{ reaction: typeof reaction }>();
    createReaction.mockReturnValue(request.promise);
    deleteReaction.mockResolvedValue({ success: true });
    await render();
    const addition = await start(() => hook.addReaction("one", "👍"));
    const temporaryId = hook.comments[0]?.reactions?.[0]?.id;
    if (!temporaryId) throw new Error("Optimistic reaction missing");
    const deletion = await start(() => hook.removeReaction("one", temporaryId));
    expect(hook.comments[0]?.reactions).toEqual([]);
    await act(async () => {
      request.resolve({ reaction });
      await addition.result;
      await deletion.result;
    });
    expect(deleteReaction.mock.calls[0]?.[0]).toEqual({ reactionId: reaction.id });
    expect(hook.comments[0]?.reactions).toEqual([]);
  });

  it("does not apply a previous task's response to the newly selected task", async () => {
    const request = deferred<{ comment: Comment }>();
    create.mockReturnValue(request.promise);
    const refreshed = jest.fn();
    await render({ onAfterMutation: refreshed });
    const pending = await start(() => hook.addComment("new"));
    await render({ taskId: "task-2", initialComments: [comment("other")] });
    await act(async () => {
      request.resolve({ comment: comment("saved") });
      await pending.result;
    });
    expect(hook.comments.map((c) => c.id)).toEqual(["other"]);
    expect(refreshed).not.toHaveBeenCalled();
  });

  it("keeps a saved comment when refreshing fails", async () => {
    create.mockResolvedValue({ comment: comment("saved") });
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    jest.spyOn(client, "fetchQuery").mockRejectedValue(new Error("refresh failed"));
    await render();
    await act(async () => {
      expect(await hook.addComment("new")).toBe(true);
    });
    expect(hook.comments.map((c) => c.id)).toEqual(["saved", "one", "two"]);
    expect(showErrorToast).not.toHaveBeenCalled();
  });

  it("does not treat a throwing refresh callback as a failed write", async () => {
    serverComments = [comment("saved"), ...serverComments];
    create.mockResolvedValue({ comment: serverComments[0] });
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    await render({
      onAfterMutation: async () => {
        throw new Error("callback failed");
      },
    });
    await act(async () => {
      expect(await hook.addComment("new")).toBe(true);
    });
    expect(hook.comments.map((c) => c.id)).toEqual(["saved", "one", "two"]);
    expect(showErrorToast).not.toHaveBeenCalled();
  });

  it("rejects edits and reactions on an unsaved comment", async () => {
    const request = deferred<{ comment: Comment }>();
    create.mockReturnValue(request.promise);
    await render();
    const addition = await start(() => hook.addComment("new"));
    const id = hook.comments[0]?.id;
    if (!id) throw new Error("Missing temporary comment");
    await act(async () => {
      expect(await hook.editComment(id, "edit")).toBe(false);
      await hook.deleteComment(id);
      await hook.addReaction(id, "👍");
    });
    expect(update).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
    expect(createReaction).not.toHaveBeenCalled();
    await act(async () => {
      request.reject(new Error("offline"));
      await addition.result;
    });
  });

  it("rolls back a malformed reaction response without disturbing other reactions", async () => {
    props.initialComments = [{ ...comment("one"), reactions: [reaction] }, comment("two")];
    createReaction.mockResolvedValue({ reaction: null });
    await render();
    await act(async () => {
      await hook.addReaction("one", "❤️");
    });
    expect(hook.comments[0]?.reactions).toEqual([reaction]);
    expect(hook.comments[1]?.reactions).toEqual([]);
  });

  it("keeps a newer optimistic edit visible when an earlier edit succeeds", async () => {
    const first = deferred<{ comment: Comment }>();
    const second = deferred<{ comment: Comment }>();
    update.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    await render();
    const a = await start(() => hook.editComment("one", "first"));
    const b = await start(() => hook.editComment("one", "second"));
    serverComments = [comment("one", '"first"'), comment("two")];
    await act(async () => {
      first.resolve({ comment: serverComments[0] as Comment });
      await a.result;
    });
    expect(hook.comments[0]?.content).toBe('"second"');
    await render({ initialComments: [...serverComments] });
    expect(hook.comments[0]?.content).toBe('"second"');
    await act(async () => {
      second.reject(new Error("offline"));
      await b.result;
    });
    expect(hook.comments[0]?.content).toBe('"first"');
  });

  it("preserves optimistic author data when the create response omits associations", async () => {
    create.mockResolvedValue({ comment: { ...comment("saved"), author: null, reactions: null } });
    const refresh = deferred<{ comments: Comment[] }>();
    jest.spyOn(client, "fetchQuery").mockReturnValue(refresh.promise);
    await render();
    const pending = await start(() => hook.addComment("new"));
    expect(hook.comments[0]?.id).toBe("saved");
    expect(hook.comments[0]?.author?.id).toBe("me");
    expect(hook.comments[0]?.reactions).toEqual([]);
    await act(async () => {
      refresh.resolve({ comments: [comment("saved"), ...serverComments] });
      await pending.result;
    });
  });

  it("rolls back a create response without an id", async () => {
    create.mockResolvedValue({ comment: { __typename: "comment" } });
    await render();
    await act(async () => {
      expect(await hook.addComment("new")).toBe(false);
    });
    expect(hook.comments.map((c) => c.id)).toEqual(["one", "two"]);
    expect(showErrorToast).toHaveBeenCalled();
  });
});
