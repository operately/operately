import { CompanyImportRun } from "@/api";
import { Paths } from "@/routes/paths";

type SortableRun = {
  insertedAt: string;
};

type MergeableRun = SortableRun & {
  id: string;
};

export function isActiveRun(run: { status: string }) {
  return run.status === "pending" || run.status === "running";
}

export function sortRuns<T extends SortableRun>(runs: T[]) {
  return [...runs].sort((a, b) => {
    const left = new Date(b.insertedAt).getTime();
    const right = new Date(a.insertedAt).getTime();
    return left - right;
  });
}

export function mergeRun<T extends MergeableRun>(runs: T[], nextRun: T) {
  const filtered = runs.filter((run) => run.id !== nextRun.id);
  return sortRuns([nextRun, ...filtered]);
}

export function toImportPageRun(run: CompanyImportRun) {
  const manifestSummary = (run.manifestSummary as Record<string, string> | undefined) ?? null;
  const manifestVersion = manifestSummary?.operatelyVersion;
  const currentVersion = window.appConfig?.version;

  const showVersionWarning = Boolean(
    run.status === "failed" && manifestVersion && currentVersion && manifestVersion !== currentVersion
  );

  return {
    ...run,
    companyPath: run.company ? Paths.companyHomePath(run.company.id) : null,
    manifestSummary: manifestSummary,
    showVersionWarning,
    versionWarning: `This package was exported from Operately ${manifestVersion}, but this instance is running ${currentVersion}. The import failure may be related to version differences.`,
  };
}
