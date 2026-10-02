import { randomUUID } from "node:crypto";
import { act, renderHook } from "@testing-library/react";
import { assertPresent } from "../../utils/assertions";
import { createKpiDemoFixtures } from "./fixtures";
import { useKpiDemo } from "./useKpiDemo";

// jsdom does not implement randomUUID, though the browser and Node do.
const originalRandomUUID = Object.getOwnPropertyDescriptor(crypto, "randomUUID");
beforeAll(() => Object.defineProperty(crypto, "randomUUID", { configurable: true, value: randomUUID }));
afterAll(() => {
  if (originalRandomUUID) Object.defineProperty(crypto, "randomUUID", originalRandomUUID);
  else Reflect.deleteProperty(crypto, "randomUUID");
});

const referenceDate = new Date("2026-07-31T12:00:00Z");
const fixtures = () => createKpiDemoFixtures({ referenceDate });
const note = { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Launch notes" }] }] };

function firstKpi(demo: ReturnType<typeof useKpiDemo>) {
  const kpi = demo.kpis[0];
  assertPresent(kpi);
  return kpi;
}

test("creates independent fixtures and demo instances, including nested dates and descriptions", async () => {
  const initial = fixtures();
  expect(fixtures()).toEqual(initial);
  const first = renderHook(() => useKpiDemo(initial));
  const second = renderHook(() => useKpiDemo(initial));
  const kpi = firstKpi(first.result.current);
  await act(async () => {
    await first.result.current.actions.onDescriptionChange(kpi.id, note);
    await first.result.current.actions.onDeleteKpi(kpi.id);
  });
  expect(second.result.current.kpis).toEqual(initial.kpis);
  expect(first.result.current.kpis).toHaveLength(initial.kpis.length - 1);
  first.unmount();
  expect(firstKpi(renderHook(() => useKpiDemo(initial)).result.current)).toEqual(initial.kpis[0]);
});

test("records entered dates and initial notes, sorts corrections, and recalculates the latest value", async () => {
  const { result } = renderHook(() => useKpiDemo(fixtures()));
  const kpi = firstKpi(result.current);
  let recordedId: string | undefined;
  await act(async () => {
    const response = await result.current.actions.onRecordEntry({
      kpiId: kpi.id,
      value: 10,
      period: "2020-03-04",
      comment: note,
    });
    recordedId = response.id;
  });
  assertPresent(recordedId);
  const entryId = recordedId;
  const entry = firstKpi(result.current).entries.find((entry) => entry.id === entryId);
  assertPresent(entry);
  expect(entry.recordedAt).toEqual(new Date(2020, 2, 4, 12));
  expect(entry.commentsCount).toBe(1);
  expect(result.current.getCommentProps(entryId).items[0]?.value).toMatchObject({ content: JSON.stringify(note) });
  expect(firstKpi(result.current).latestEntry?.id).toBe(kpi.latestEntry?.id);
  await act(async () => {
    await result.current.actions.onEditEntry({ entryId, value: 25, period: "2030-02-05" });
  });
  expect(firstKpi(result.current).latestEntry).toMatchObject({
    id: entryId,
    value: 25,
    edits: [{ previousValue: 10, previousPeriod: new Date(2020, 2, 4, 12) }],
  });
  await act(async () => {
    await result.current.actions.onDeleteEntry(entryId);
  });
  expect(firstKpi(result.current).latestEntry?.id).toBe(kpi.latestEntry?.id);
  expect(result.current.comments[entryId]).toBeUndefined();
});

test("shares comment edits, reactions and counts across panel lifecycles", async () => {
  const { result, rerender } = renderHook(() => useKpiDemo(fixtures()));
  const entry = firstKpi(result.current).latestEntry;
  assertPresent(entry);
  const initialCount = result.current.getCommentProps(entry.id).items.length;
  await act(async () => {
    await result.current.getCommentProps(entry.id).onAddComment(note);
  });
  rerender();
  const added = result.current.getCommentProps(entry.id).items.at(-1);
  assertPresent(added);
  await act(async () => {
    await result.current.getCommentProps(entry.id).onEditComment(added.value.id, { type: "doc", content: [] });
    await result.current.getCommentProps(entry.id).onAddReaction(added.value.id, "👍");
    await result.current.getCommentProps(entry.id).onAddReaction(added.value.id, "👍");
  });
  const edited = result.current.getCommentProps(entry.id).items.at(-1);
  assertPresent(edited);
  expect(edited.value.content).toBe(JSON.stringify({ type: "doc", content: [] }));
  expect(edited.value.reactions).toHaveLength(1);
  const reaction = edited.value.reactions[0];
  assertPresent(reaction);
  expect(firstKpi(result.current).latestEntry?.commentsCount).toBe(initialCount + 1);
  await act(async () => {
    await result.current.getCommentProps(entry.id).onRemoveReaction(added.value.id, reaction.id);
  });
  expect(result.current.getCommentProps(entry.id).items.at(-1)?.value.reactions).toEqual([]);
  await act(async () => {
    await result.current.getCommentProps(entry.id).onDeleteComment(added.value.id);
  });
  expect(firstKpi(result.current).latestEntry?.commentsCount).toBe(initialCount);
});

test("keeps subscriptions separate per KPI and cleans up deleted KPI threads", async () => {
  const { result } = renderHook(() => useKpiDemo(fixtures()));
  const [first, second] = result.current.kpis;
  assertPresent(first);
  assertPresent(second);
  const other = result.current.getSubscriptionProps(second.id).isSubscribed;
  await act(async () => {
    await result.current.getSubscriptionProps(first.id).onToggle(false);
  });
  expect(result.current.getSubscriptionProps(first.id).isSubscribed).toBe(false);
  expect(result.current.getSubscriptionProps(second.id).isSubscribed).toBe(other);
  await act(async () => {
    await result.current.actions.onDeleteKpi(first.id);
  });
  expect(result.current.subscriptions[first.id]).toBeUndefined();
  for (const entry of first.entries) expect(result.current.comments[entry.id]).toBeUndefined();
});

test("creates and edits KPIs and annotations using fixture people", async () => {
  const { result } = renderHook(() => useKpiDemo(fixtures()));
  const person = result.current.currentUser;
  let createdId: string | undefined;
  await act(async () => {
    createdId = (
      await result.current.actions.onCreateKpi({
        name: "Trials",
        unit: "users",
        cadence: "weekly",
        championId: person.id,
      })
    ).id;
  });
  assertPresent(createdId);
  const id = createdId;
  await act(async () => {
    await result.current.actions.onEditKpi({
      id,
      name: "Activations",
      unit: "%",
      cadence: "monthly",
      championId: null,
    });
    await result.current.actions.onDescriptionChange(id, note);
  });
  expect(result.current.kpis.find((kpi) => kpi.id === id)).toMatchObject({
    name: "Activations",
    champion: null,
    description: note,
  });
  let createdAnnotationId: string | undefined;
  await act(async () => {
    createdAnnotationId = (
      await result.current.actions.onAddAnnotation({ kpiId: id, date: "2026-07-01", title: "Launch" })
    ).id;
  });
  assertPresent(createdAnnotationId);
  const annotationId = createdAnnotationId;
  await act(async () => {
    await result.current.actions.onEditAnnotation({ id: annotationId, date: "2026-07-02", title: "Release" });
  });
  expect(result.current.kpis.find((kpi) => kpi.id === id)?.annotations).toMatchObject([
    { title: "Release", date: new Date(2026, 6, 2, 12) },
  ]);
  await act(async () => {
    await result.current.actions.onDeleteAnnotation(annotationId);
  });
  expect(result.current.kpis.find((kpi) => kpi.id === id)?.annotations).toEqual([]);
  expect(await result.current.championSearch(person.fullName.toUpperCase())).toContainEqual(person);
  expect(await result.current.richTextHandlers.mentionedPersonLookup(person.id)).toEqual(person);
});

test("simulated failures leave KPI, comment, reaction and subscription state unchanged", async () => {
  const { result } = renderHook(() => useKpiDemo(fixtures(), { failMutations: true }));
  const before = result.current;
  const kpi = firstKpi(before);
  const entry = kpi.latestEntry;
  assertPresent(entry);
  await act(async () => {
    expect((await result.current.actions.onDeleteKpi(kpi.id)).success).toBe(false);
    expect(await result.current.actions.onDescriptionChange(kpi.id, note)).toBe(false);
    expect(await result.current.getCommentProps(entry.id).onAddComment(note)).toBe(false);
    await expect(result.current.getSubscriptionProps(kpi.id).onToggle(false)).rejects.toThrow();
    const comment = result.current.getCommentProps(entry.id).items[0];
    assertPresent(comment);
    await expect(result.current.getCommentProps(entry.id).onAddReaction(comment.value.id, "👍")).rejects.toThrow();
  });
  expect(result.current.kpis).toEqual(before.kpis);
  expect(result.current.comments).toEqual(before.comments);
  expect(result.current.subscriptions).toEqual(before.subscriptions);
});

test("releases uploaded object URLs on disposal", async () => {
  const create = jest.fn(() => "blob:demo-file");
  const revoke = jest.fn();
  const oldCreate = URL.createObjectURL;
  const oldRevoke = URL.revokeObjectURL;
  URL.createObjectURL = create;
  URL.revokeObjectURL = revoke;
  try {
    const { result, unmount } = renderHook(() => useKpiDemo(fixtures()));
    const upload = result.current.richTextHandlers.uploadFile;
    assertPresent(upload);
    const progress = jest.fn();
    expect(await upload(new File(["file"], "example.txt"), progress)).toMatchObject({ url: "blob:demo-file" });
    expect(progress).toHaveBeenCalledWith(100);
    unmount();
    expect(revoke).toHaveBeenCalledWith("blob:demo-file");
  } finally {
    URL.createObjectURL = oldCreate;
    URL.revokeObjectURL = oldRevoke;
  }
});

test("supports empty and single-entry scenarios without shared nested objects", () => {
  expect(createKpiDemoFixtures({ scenario: "empty" }).kpis).toEqual([]);
  const single = createKpiDemoFixtures({ scenario: "single-entry" });
  expect(single.kpis).toHaveLength(1);
  expect(single.kpis[0]?.entries).toHaveLength(1);
  const first = fixtures();
  const second = fixtures();
  const entry = first.kpis[0]?.entries[0];
  assertPresent(entry);
  entry.recordedAt.setFullYear(1999);
  first.currentUser.fullName = "Changed";
  expect(second).toEqual(fixtures());
});

test("rejects impossible dates without changing state", async () => {
  const { result } = renderHook(() => useKpiDemo(fixtures()));
  const before = result.current.kpis;
  await act(async () => {
    expect(
      await result.current.actions.onRecordEntry({
        kpiId: firstKpi(result.current).id,
        period: "2026-02-30",
        value: 10,
      }),
    ).toMatchObject({ success: false });
  });
  expect(result.current.kpis).toBe(before);
});

test("applies delayed concurrent mutations to the latest state and ignores disposed work", async () => {
  jest.useFakeTimers();
  try {
    const { result, unmount } = renderHook(() => useKpiDemo(fixtures(), { mutationDelayMs: 100 }));
    const id = firstKpi(result.current).id;
    const count = firstKpi(result.current).entries.length;
    const first = result.current.actions.onRecordEntry({ kpiId: id, period: "2026-08-01", value: 10 });
    const second = result.current.actions.onRecordEntry({ kpiId: id, period: "2026-08-02", value: 20 });
    expect(firstKpi(result.current).entries).toHaveLength(count);
    await act(async () => {
      await jest.advanceTimersByTimeAsync(100);
      await Promise.all([first, second]);
    });
    expect(firstKpi(result.current).entries).toHaveLength(count + 2);
    expect(firstKpi(result.current).latestEntry?.value).toBe(20);
    const pending = result.current.actions.onDeleteKpi(id);
    unmount();
    await jest.advanceTimersByTimeAsync(100);
    expect(await pending).toMatchObject({ success: false });
  } finally {
    jest.useRealTimers();
  }
});
