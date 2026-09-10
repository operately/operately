/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Api, { type Reaction } from "@/api";
import { type Entity } from "./entity";
import { useOptimisticReactions } from "./useOptimisticReactions";
jest.mock("react-router", () => ({}));
jest.mock("@/routes/paths", () => ({
  compareIds: jest.requireActual("@/routes/paths").compareIds,
  usePaths: () => ({}),
}));
jest.mock("@/contexts/CurrentCompanyContext", () => ({ useMe: () => ({ id: "me", fullName: "Me" }) }));
jest.mock("@/models/people", () => ({ parsePersonForTurboUi: (_paths, person) => person }));
jest.mock("turboui", () => ({ showErrorToast: jest.fn() }));

let root: Root;
let client: QueryClient;
let hook: ReturnType<typeof useOptimisticReactions>;
let create: jest.Mock;
let remove: jest.Mock;
let entity: Entity;
let onRefresh: jest.Mock;
let initial: Reaction[];
const reaction = {
  __typename: "reaction" as const,
  id: "saved",
  emoji: "👍",
  person: { id: "me", fullName: "Me" },
} as Reaction;
function Harness() {
  hook = useOptimisticReactions({ entity, initialReactions: initial, onRefresh });
  return null;
}
async function render() {
  await act(async () =>
    root.render(
      <QueryClientProvider client={client}>
        <Harness />
      </QueryClientProvider>,
    ),
  );
}
beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({});
  client = new QueryClient();
  root = createRoot(document.createElement("div"));
  entity = { id: "resource1", type: "project_check_in" };
  onRefresh = jest.fn().mockResolvedValue(undefined);
  initial = [];
  create = jest.fn();
  remove = jest.fn().mockResolvedValue({});
  jest.spyOn(Api.reactions, "createMutationOptions").mockReturnValue({ mutationFn: create });
  jest.spyOn(Api.reactions, "deleteMutationOptions").mockReturnValue({ mutationFn: remove });
});
afterEach(async () => {
  await act(async () => root.unmount());
  client.clear();
  jest.restoreAllMocks();
});

it("rolls back failed writes and refreshes only after success", async () => {
  create.mockRejectedValueOnce(new Error("failed")).mockResolvedValue({ reaction });
  await render();
  await act(async () => {
    await hook.onAddReaction("👍");
  });
  expect(hook.reactions).toEqual([]);
  expect(onRefresh).not.toHaveBeenCalled();
  await act(async () => {
    await hook.onAddReaction("👍");
  });
  expect(hook.reactions.map((r) => r.id)).toEqual(["saved"]);
  expect(onRefresh).toHaveBeenCalledTimes(1);
  remove.mockRejectedValueOnce(new Error("failed"));
  await act(async () => {
    await hook.onRemoveReaction("saved");
  });
  expect(hook.reactions.map((r) => r.id)).toEqual(["saved"]);
  expect(onRefresh).toHaveBeenCalledTimes(1);
});

it.each([
  { id: "project1", type: "project_check_in" },
  { id: "message1", type: "message" },
  { id: "comment1", type: "comment", parentType: "project_task" },
] satisfies Entity[])("sends the entity and parent type for $type", async (resource) => {
  entity = resource;
  create.mockResolvedValue({ reaction });
  await render();
  await act(async () => {
    await hook.onAddReaction("👍");
  });
  expect(create.mock.calls[0]?.[0]).toEqual({
    entityId: resource.id,
    entityType: resource.type,
    parentType: resource.parentType,
    emoji: "👍",
  });
  expect(onRefresh).toHaveBeenCalledTimes(1);
});

it("resolves a queued removal of an optimistic reaction to its server ID", async () => {
  let finish: (value: unknown) => void = () => {};
  create.mockReturnValue(
    new Promise((resolve) => {
      finish = resolve;
    }),
  );
  await render();
  let adding: Promise<void>;
  let removing: Promise<void>;
  await act(async () => {
    adding = hook.onAddReaction("👍");
  });
  const id = hook.reactions[0]?.id;
  if (!id) throw new Error("Missing optimistic reaction");
  await act(async () => {
    removing = hook.onRemoveReaction(id);
  });
  expect(hook.reactions).toEqual([]);
  await act(async () => {
    finish({ reaction });
    await adding;
    await removing;
  });
  expect(remove.mock.calls[0]?.[0]).toEqual({ reactionId: "saved" });
  expect(hook.reactions).toEqual([]);
  expect(onRefresh).toHaveBeenCalledTimes(1);
});

it.each(["id", "type", "parentType"] as const)(
  "isolates pending writes and refresh callbacks when the entity %s changes",
  async (field) => {
    entity = { id: "resource1", type: "comment", parentType: "goal_update" };
    const originalRefresh = onRefresh;
    let finish: (value: unknown) => void = () => {};
    create.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    await render();
    let adding: Promise<void>;
    await act(async () => {
      adding = hook.onAddReaction("👍");
    });
    entity =
      field === "id"
        ? { ...entity, id: "resource2" }
        : field === "type"
          ? { ...entity, type: "message" }
          : { ...entity, parentType: "project_task" };
    onRefresh = jest.fn();
    await render();
    await act(async () => {
      finish({ reaction });
      await adding;
    });
    expect(hook.reactions).toEqual([]);
    expect(originalRefresh).toHaveBeenCalledTimes(1);
    expect(onRefresh).not.toHaveBeenCalled();
  },
);

it.each(["during refresh", "after refresh"] as const)(
  "keeps server reactions received %s when a queued reaction fails",
  async (arrival) => {
    let finishRefresh: () => void = () => {};
    let failQueued: (error: Error) => void = () => {};
    onRefresh.mockReturnValue(
      new Promise<void>((resolve) => {
        finishRefresh = resolve;
      }),
    );
    create.mockResolvedValueOnce({ reaction }).mockImplementationOnce(
      () =>
        new Promise((_resolve, reject) => {
          failQueued = reject;
        }),
    );

    await render();

    let first: Promise<void>;
    let second: Promise<void>;
    await act(async () => {
      first = hook.onAddReaction("👍");
    });
    expect(onRefresh).toHaveBeenCalledTimes(1);

    await act(async () => {
      second = hook.onAddReaction("❤️");
    });
    expect(create).toHaveBeenCalledTimes(1);

    const serverReactions = [reaction, { ...reaction, id: "other-person", emoji: "🎉" }];
    if (arrival === "during refresh") {
      initial = serverReactions;
      await render();
    }

    await act(async () => {
      finishRefresh();
      await first;
    });
    expect(create).toHaveBeenCalledTimes(2);

    if (arrival === "after refresh") {
      initial = serverReactions;
      await render();
    }

    await act(async () => {
      failQueued(new Error("failed"));
      await second;
    });

    expect(hook.reactions.map((r) => r.id)).toEqual(["saved", "other-person"]);
    expect(onRefresh).toHaveBeenCalledTimes(1);
  },
);

it("does not overwrite a later successful reaction with an older server snapshot", async () => {
  let finishSave: (value: unknown) => void = () => {};
  create.mockReturnValue(
    new Promise((resolve) => {
      finishSave = resolve;
    }),
  );

  await render();

  let adding: Promise<void>;
  await act(async () => {
    adding = hook.onAddReaction("👍");
  });

  initial = [{ ...reaction, id: "other-person", emoji: "🎉" }];
  await render();

  await act(async () => {
    finishSave({ reaction });
    await adding;
  });

  expect(hook.reactions.map((r) => r.id)).toContain("saved");
});
