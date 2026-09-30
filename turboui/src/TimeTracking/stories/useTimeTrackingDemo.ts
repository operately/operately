import React from "react";
import { browserLocale } from "../../utils/formatting";
import { zonedDateTimeToDate } from "../../utils/timezone";
import { createDemoEntries, demoDestinations, demoPerson, demoTask, demoToday } from "../mockData";
import { dateKey, shiftDate } from "../time";
import type { ActiveTimer, TimeActionResult, TimeEntry, TimeEntryInput, TimeTrackingData } from "../types";

export type DemoRole = "manager" | "member" | "guest" | "viewer";
export type DemoScenario =
  | "default"
  | "empty"
  | "loading"
  | "error"
  | "slow-save"
  | "save-error"
  | "disabled"
  | "long-timer"
  | "closed-task";
export interface DemoOptions {
  role: DemoRole;
  scenario: DemoScenario;
  locale?: string;
}
interface DemoStore {
  entries: TimeEntry[];
  timer: ActiveTimer | null;
  enabled: Record<string, boolean>;
}

// Persistence and simulated server behavior belong to the story, never the UI components.
export function useTimeTrackingDemo({ role, scenario, locale }: DemoOptions) {
  const today = demoToday("UTC");
  const [store, setStore] = React.useState<DemoStore>(() => ({
    entries: scenario === "empty" ? [] : createDemoEntries(today),
    timer:
      scenario === "long-timer" || scenario === "closed-task"
        ? {
            id: "initial-timer",
            destination: demoTask,
            startedAt: new Date(Date.now() - (scenario === "long-timer" ? 9 * 3600 : 1200) * 1000).toISOString(),
          }
        : null,
    enabled: { launch: scenario !== "disabled", product: true },
  }));
  const [closedTasks, setClosedTasks] = React.useState<string[]>(scenario === "closed-task" ? [demoTask.id] : []);
  const latest = React.useRef(store);
  const lock = React.useRef(false);
  const [loadError, setLoadError] = React.useState(scenario === "error");
  const [failSave, setFailSave] = React.useState(scenario === "save-error");
  const canViewTeam = role === "manager";
  const canWrite = role !== "viewer";
  const canEdit = (entry: TimeEntry) => canWrite && (role === "manager" || entry.person.id === demoPerson.id);
  const destinations = demoDestinations.map((destination) => ({
    ...destination,
    enabled: store.enabled[destination.scopeId] ?? false,
    canTrack: canWrite,
    closed: closedTasks.includes(destination.id),
  }));
  const visibleEntries = store.entries
    .filter((entry) => canViewTeam || entry.person.id === demoPerson.id)
    .map((entry) => ({ ...entry, canEdit: canEdit(entry), canDelete: canEdit(entry) }));

  const mutate = async (change: (current: DemoStore) => DemoStore): Promise<TimeActionResult> => {
    if (lock.current) return { ok: false, error: "Another change is being saved. Please try again." };
    lock.current = true;
    try {
      await new Promise((resolve) => window.setTimeout(resolve, scenario === "slow-save" ? 2500 : 200));
      if (failSave) {
        setFailSave(false);
        return { ok: false, error: "Your changes could not be saved. Please try again." };
      }
      const next = change(latest.current);
      latest.current = next;
      setStore(next);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "The change could not be saved." };
    } finally {
      lock.current = false;
    }
  };
  const requireDestination = (id: string) => {
    const destination = destinations.find((item) => item.id === id);
    if (!destination || !canWrite || !latest.current.enabled[destination.scopeId])
      throw new Error("Time tracking is not available for this work.");
    return destination;
  };
  const finishTimer = (current: DemoStore, timerId: string) => {
    if (!current.timer || current.timer.id !== timerId)
      throw new Error("This timer has already stopped. Review the saved entries.");
    const endedAt = new Date().toISOString();
    const input: TimeEntryInput = {
      destinationId: current.timer.destination.id,
      date: dateKey(new Date(current.timer.startedAt), "UTC"),
      timezone: "UTC",
      notes: "",
      durationSeconds: Math.max(
        1,
        Math.floor((new Date(endedAt).getTime() - new Date(current.timer.startedAt).getTime()) / 1000),
      ),
      startedAt: current.timer.startedAt,
      endedAt,
    };
    return {
      ...current,
      timer: null,
      entries: [...newEntries(input, current.timer.destination, "timer"), ...current.entries],
    };
  };

  const data: TimeTrackingData = {
    entries: visibleEntries,
    destinations,
    currentPersonId: demoPerson.id,
    activeTimer: canWrite ? store.timer : null,
    today,
    formattedTimePreferences: { locale: locale ?? browserLocale(), timezone: "UTC", timeFormat: "automatic" },
    loading: scenario === "loading",
    error: loadError ? "Time entries could not be loaded." : null,
    onRetry: () => setLoadError(false),
    onSaveEntry: (input, entryId) =>
      mutate((current) => {
        const existing = entryId ? current.entries.find((entry) => entry.id === entryId) : undefined;
        if (entryId && (!existing || !canEdit(existing))) throw new Error("You cannot edit this entry.");
        const destination = existing?.destination ?? requireDestination(input.destinationId);
        const replacements = newEntries(input, destination, existing?.source ?? "manual", existing);
        return { ...current, entries: [...replacements, ...current.entries.filter((entry) => entry.id !== entryId)] };
      }),
    onDeleteEntry: (id) =>
      mutate((current) => {
        const entry = current.entries.find((item) => item.id === id);
        if (!entry || !canEdit(entry)) throw new Error("You cannot delete this entry.");
        return { ...current, entries: current.entries.filter((item) => item.id !== id) };
      }),
    onStartTimer: (id) =>
      mutate((current) => {
        if (current.timer) throw new Error("A timer is already running. Switch to the new work instead.");
        return {
          ...current,
          timer: { id: crypto.randomUUID(), destination: requireDestination(id), startedAt: new Date().toISOString() },
        };
      }),
    onSwitchTimer: (timerId, destinationId) =>
      mutate((current) => {
        const destination = requireDestination(destinationId);
        return {
          ...finishTimer(current, timerId),
          timer: { id: crypto.randomUUID(), destination, startedAt: new Date().toISOString() },
        };
      }),
    onStopTimer: (timerId) => mutate((current) => finishTimer(current, timerId)),
    onDiscardTimer: (timerId) =>
      mutate((current) => {
        if (current.timer?.id !== timerId) throw new Error("This timer has already stopped.");
        return { ...current, timer: null };
      }),
  };
  return {
    data,
    canViewTeam,
    failSave,
    setFailSave,
    onTaskClosedChange: (id: string, closed: boolean) =>
      setClosedTasks((current) =>
        closed ? [...current.filter((item) => item !== id), id] : current.filter((item) => item !== id),
      ),
    onEnabledChange:
      role === "manager"
        ? (enabled: boolean) => mutate((current) => ({ ...current, enabled: { ...current.enabled, launch: enabled } }))
        : undefined,
  };
}

function newEntries(
  input: TimeEntryInput,
  destination: TimeEntry["destination"],
  source: TimeEntry["source"],
  original?: TimeEntry,
): TimeEntry[] {
  const base: TimeEntry = {
    ...input,
    destination,
    source,
    id: original?.id ?? crypto.randomUUID(),
    person: original?.person ?? demoPerson,
    canEdit: true,
    canDelete: true,
  };
  if (!input.startedAt || !input.endedAt) return [base];
  let start = new Date(input.startedAt);
  const end = new Date(input.endedAt);
  const entries: TimeEntry[] = [];
  // Demo-only calendar allocation; the backend will own authoritative accounting.
  while (start < end) {
    const date = dateKey(start, input.timezone);
    const [year = 0, month = 0, day = 0] = shiftDate(date, 1).split("-").map(Number);
    const midnight = zonedDateTimeToDate({ year, month, day, hour: 0, minute: 0 }, input.timezone);
    if (!midnight) throw new Error("The session could not be split at midnight in this timezone.");
    const segmentEnd = midnight < end ? midnight : end;
    entries.push({
      ...base,
      id: entries.length ? crypto.randomUUID() : base.id,
      date,
      durationSeconds: Math.max(1, Math.round((segmentEnd.getTime() - start.getTime()) / 1000)),
      startedAt: start.toISOString(),
      endedAt: segmentEnd.toISOString(),
    });
    start = segmentEnd;
  }
  return entries;
}
