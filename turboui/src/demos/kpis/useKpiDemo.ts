import { assertPresent } from "../../utils/assertions";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SpaceKpisPage as KPI } from "../../SpaceKpisPage/types";
import type { RichTextHandlers } from "../../RichContent/types";
import { cloneData, normalizeState, changeKpi, entryKpi, annotationKpi, withoutKeys, recordedDate } from "./state";
import type {
  KpiDemoActions,
  KpiDemoComment,
  KpiDemoCommentProps,
  KpiDemoFixtures,
  KpiDemoMutation,
  KpiDemoOptions,
  KpiDemoState,
  KpiDemoSubscriptionProps,
} from "./types";

/** Mount above routes and comment panels; all state lasts only for this hook's lifetime. */
export function useKpiDemo(initialFixtures: KpiDemoFixtures, options: KpiDemoOptions = {}) {
  const [fixtures] = useState(() => cloneData(initialFixtures));
  const [state, setState] = useState<KpiDemoState>(() => {
    const { kpis, comments, subscriptions } = cloneData(fixtures);
    return normalizeState({ kpis, comments, subscriptions });
  });
  const current = useRef(state);
  const mounted = useRef(true);
  const uploadUrls = useRef(new Set<string>());
  const { mutationDelayMs = 0, failMutations = false } = options;

  useEffect(() => {
    mounted.current = true;
    const urls = uploadUrls.current;
    return () => {
      mounted.current = false;
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.clear();
    };
  }, []);

  const beforeMutation = useCallback(
    async (operation: KpiDemoMutation) => {
      if (mutationDelayMs > 0) await new Promise((resolve) => setTimeout(resolve, mutationDelayMs));
      if (!mounted.current) throw new Error("Demo was disposed.");
      if (typeof failMutations === "function" ? failMutations(operation) : failMutations) {
        throw new Error("Simulated mutation failure. Please try again.");
      }
    },
    [mutationDelayMs, failMutations],
  );

  const mutate = useCallback(
    async (
      operation: KpiDemoMutation,
      update: (state: KpiDemoState) => KpiDemoState,
      id?: string,
    ): Promise<KPI.MutationResult> => {
      try {
        await beforeMutation(operation);
        // Apply against the latest state after the delay, including concurrent mutations.
        const next = normalizeState(update(current.current));
        current.current = next;
        setState(next);
        return { success: true, id };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Demo mutation failed." };
      }
    },
    [beforeMutation],
  );

  const championSearch = useCallback(
    async (query: string) =>
      fixtures.people.filter((person) => person.fullName.toLowerCase().includes(query.trim().toLowerCase())),
    [fixtures],
  );

  const richTextHandlers = useMemo<RichTextHandlers>(
    () => ({
      resolveResourceLinks: null,
      mentionedPersonLookup: async (id) => fixtures.people.find((person) => person.id === id) ?? null,
      peopleSearch: ({ query }) => championSearch(query),
      uploadFile: async (file, onProgress) => {
        await beforeMutation("uploadFile");
        const url = URL.createObjectURL(file);
        uploadUrls.current.add(url);
        onProgress(100);
        return { id: crypto.randomUUID(), url };
      },
      taskList: { canEdit: false },
      onCommentTaskItemChange: null,
    }),
    [fixtures, championSearch, beforeMutation],
  );

  const createComment = (content: Record<string, unknown>): KpiDemoComment => ({
    type: "comment",
    value: {
      id: crypto.randomUUID(),
      content: JSON.stringify(content),
      author: fixtures.currentUser,
      insertedAt: new Date().toISOString(),
      reactions: [],
    },
  });

  const actions: KpiDemoActions = {
    onCreateKpi: async (input) => {
      const id = crypto.randomUUID();
      return mutate(
        "onCreateKpi",
        (state) => ({
          ...state,
          kpis: [
            ...state.kpis,
            {
              id,
              name: input.name,
              unit: input.unit,
              cadence: input.cadence,
              champion: fixtures.people.find((person) => person.id === input.championId) ?? null,
              description: null,
              insertedAt: new Date(),
              link: `${fixtures.kpisLink}/${id}`,
              entries: [],
              latestEntry: null,
              annotations: [],
            },
          ],
          subscriptions: { ...state.subscriptions, [id]: true },
        }),
        id,
      );
    },
    onEditKpi: (input) =>
      mutate(
        "onEditKpi",
        (state) =>
          changeKpi(state, input.id, (kpi) => ({
            ...kpi,
            name: input.name,
            unit: input.unit,
            cadence: input.cadence,
            champion: fixtures.people.find((person) => person.id === input.championId) ?? null,
          })),
        input.id,
      ),
    onDescriptionChange: async (id, description) =>
      (
        await mutate("onDescriptionChange", (state) =>
          changeKpi(state, id, (kpi) => ({ ...kpi, description: cloneData(description) })),
        )
      ).success,
    onDeleteKpi: (id) =>
      mutate("onDeleteKpi", (state) => {
        const kpi = state.kpis.find((kpi) => kpi.id === id);
        assertPresent(kpi, "KPI not found.");
        return {
          ...state,
          kpis: state.kpis.filter((kpi) => kpi.id !== id),
          comments: withoutKeys(
            state.comments,
            kpi.entries.map((entry) => entry.id),
          ),
          subscriptions: withoutKeys(state.subscriptions, [id]),
        };
      }),
    onRecordEntry: (input) => {
      const id = crypto.randomUUID();
      return mutate(
        "onRecordEntry",
        (state) => {
          const entry: KPI.KpiEntry = {
            id,
            value: input.value,
            recordedAt: recordedDate(input.period),
            recordedBy: fixtures.currentUser,
            commentsCount: 0,
            edits: [],
          };
          const updated = changeKpi(state, input.kpiId, (kpi) => ({ ...kpi, entries: [...kpi.entries, entry] }));
          return {
            ...updated,
            comments: { ...updated.comments, [id]: input.comment ? [createComment(input.comment)] : [] },
          };
        },
        id,
      );
    },
    onEditEntry: (input) =>
      mutate(
        "onEditEntry",
        (state) =>
          changeKpi(state, entryKpi(state, input.entryId).id, (kpi) => ({
            ...kpi,
            entries: kpi.entries.map((entry) =>
              entry.id !== input.entryId
                ? entry
                : {
                    ...entry,
                    value: input.value,
                    recordedAt: recordedDate(input.period),
                    edits: [
                      {
                        id: crypto.randomUUID(),
                        previousValue: entry.value,
                        previousPeriod: entry.recordedAt,
                        editedBy: fixtures.currentUser,
                        editedAt: new Date(),
                      },
                      ...entry.edits,
                    ],
                  },
            ),
          })),
        input.entryId,
      ),
    onDeleteEntry: (id) =>
      mutate("onDeleteEntry", (state) => ({
        ...changeKpi(state, entryKpi(state, id).id, (kpi) => ({
          ...kpi,
          entries: kpi.entries.filter((entry) => entry.id !== id),
        })),
        comments: withoutKeys(state.comments, [id]),
      })),
    onAddAnnotation: (input) => {
      const id = crypto.randomUUID();
      return mutate(
        "onAddAnnotation",
        (state) =>
          changeKpi(state, input.kpiId, (kpi) => ({
            ...kpi,
            annotations: [
              ...kpi.annotations,
              { id, title: input.title, date: recordedDate(input.date), createdBy: fixtures.currentUser },
            ],
          })),
        id,
      );
    },
    onEditAnnotation: (input) =>
      mutate(
        "onEditAnnotation",
        (state) =>
          changeKpi(state, annotationKpi(state, input.id).id, (kpi) => ({
            ...kpi,
            annotations: kpi.annotations.map((annotation) =>
              annotation.id === input.id
                ? { ...annotation, title: input.title, date: recordedDate(input.date) }
                : annotation,
            ),
          })),
        input.id,
      ),
    onDeleteAnnotation: (id) =>
      mutate("onDeleteAnnotation", (state) =>
        changeKpi(state, annotationKpi(state, id).id, (kpi) => ({
          ...kpi,
          annotations: kpi.annotations.filter((annotation) => annotation.id !== id),
        })),
      ),
  };

  function getCommentProps(entryId: string): KpiDemoCommentProps {
    const updateComments = (operation: KpiDemoMutation, update: (items: KpiDemoComment[]) => KpiDemoComment[]) =>
      mutate(operation, (state) => {
        entryKpi(state, entryId);
        return { ...state, comments: { ...state.comments, [entryId]: update(state.comments[entryId] ?? []) } };
      });
    const updateComment = (operation: KpiDemoMutation, id: string, update: (item: KpiDemoComment) => KpiDemoComment) =>
      updateComments(operation, (items) => {
        if (!items.some((item) => item.value.id === id)) throw new Error("Comment not found.");
        return items.map((item) => (item.value.id === id ? update(item) : item));
      });

    return {
      items: state.comments[entryId] ?? [],
      currentUser: fixtures.currentUser,
      richTextHandlers,
      commentParentType: "kpi_entry",
      onAddComment: async (content) =>
        (await updateComments("addComment", (items) => [...items, createComment(content)])).success,
      onEditComment: async (id, content) =>
        (
          await updateComment("editComment", id, (item) => ({
            ...item,
            value: { ...item.value, content: JSON.stringify(content) },
          }))
        ).success,
      onDeleteComment: async (id) =>
        requireSuccess(await updateComments("deleteComment", (items) => items.filter((item) => item.value.id !== id))),
      onAddReaction: async (id, emoji) =>
        requireSuccess(
          await updateComment("addReaction", id, (item) => {
            const reactions = item.value.reactions;
            if (
              reactions.some((reaction) => reaction.emoji === emoji && reaction.person.id === fixtures.currentUser.id)
            )
              return item;
            return {
              ...item,
              value: {
                ...item.value,
                reactions: [...reactions, { id: crypto.randomUUID(), emoji, person: fixtures.currentUser }],
              },
            };
          }),
        ),
      onRemoveReaction: async (id, reactionId) =>
        requireSuccess(
          await updateComment("removeReaction", id, (item) => ({
            ...item,
            value: { ...item.value, reactions: item.value.reactions.filter((reaction) => reaction.id !== reactionId) },
          })),
        ),
    };
  }

  function getSubscriptionProps(kpiId: string): KpiDemoSubscriptionProps {
    const isSubscribed = state.subscriptions[kpiId] ?? false;
    return {
      entityType: "kpi",
      hidden: false,
      isSubscribed,
      subscribedPeople: isSubscribed ? [fixtures.currentUser] : [],
      onToggle: async (subscribed) =>
        requireSuccess(
          await mutate("toggleSubscription", (state) => {
            if (!state.kpis.some((kpi) => kpi.id === kpiId)) throw new Error("KPI not found.");
            return { ...state, subscriptions: { ...state.subscriptions, [kpiId]: subscribed } };
          }),
        ),
    };
  }

  return {
    ...state,
    people: fixtures.people,
    currentUser: fixtures.currentUser,
    space: fixtures.space,
    kpisLink: fixtures.kpisLink,
    actions,
    championSearch,
    richTextHandlers,
    getCommentProps,
    getSubscriptionProps,
  };
}

// Comment deletion/reactions and notification toggles report errors by rejecting, not by returning a boolean.
function requireSuccess(result: KPI.MutationResult): void {
  if (!result.success) throw new Error(result.error);
}

export type KpiDemo = ReturnType<typeof useKpiDemo>;
