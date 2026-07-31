import { resolveSourceType, scheduleActiveRunRefresh, startMaintenanceAndRefresh } from "./index";

jest.mock("turboui", () => ({
  showSuccessToast: jest.fn(),
}));

describe("SaasAdminSearchIndexPage", () => {
  afterEach(() => jest.useRealTimers());

  test("refreshes every five seconds while maintenance is active", () => {
    jest.useFakeTimers();
    const refresh = jest.fn();

    const stop = scheduleActiveRunRefresh(
      [
        {
          sourceType: "project",
          latestRun: {
            id: "run-1",
            kind: "backfill",
            status: "running",
            phase: "source_scan",
            processedCount: 0,
            insertedCount: 0,
            updatedCount: 0,
            unchangedCount: 0,
            supersededCount: 0,
            skippedCount: 0,
            failedCount: 0,
            deletedOrphanCount: 0,
            insertedAt: "2026-07-30T10:00:00Z",
          },
        },
      ],
      refresh,
    );

    jest.advanceTimersByTime(10_000);
    expect(refresh).toHaveBeenCalledTimes(2);

    stop();
    jest.advanceTimersByTime(5_000);
    expect(refresh).toHaveBeenCalledTimes(2);
  });

  test("does not poll when all runs are terminal", () => {
    jest.useFakeTimers();
    const refresh = jest.fn();

    scheduleActiveRunRefresh([{ sourceType: "project", latestRun: null }], refresh);
    jest.advanceTimersByTime(10_000);

    expect(refresh).not.toHaveBeenCalled();
  });

  test("starts the requested scope and refreshes after success", async () => {
    const start = jest.fn().mockResolvedValue({ startedSourceTypes: ["project"], alreadyRunningSourceTypes: [] });
    const refresh = jest.fn();

    const result = await startMaintenanceAndRefresh(start, refresh, "reconciliation", "project");

    expect(start).toHaveBeenCalledWith({ kind: "reconciliation", sourceType: "project" });
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(result.startedSourceTypes).toEqual(["project"]);
  });

  test("propagates failures without refreshing", async () => {
    const start = jest.fn().mockRejectedValue(new Error("unavailable"));
    const refresh = jest.fn();

    await expect(startMaintenanceAndRefresh(start, refresh, "backfill")).rejects.toThrow("unavailable");
    expect(refresh).not.toHaveBeenCalled();
  });

  test("resolves only source types returned by the API", () => {
    const sources = [{ sourceType: "project" as const }];

    expect(resolveSourceType(sources, "project")).toBe("project");
    expect(resolveSourceType(sources)).toBeUndefined();
    expect(() => resolveSourceType(sources, "missing")).toThrow("Unknown search index source type: missing");
  });
});
