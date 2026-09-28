import { CompanyImportRun } from "@/api";
import { Paths } from "@/routes/paths";
import i18n from "@/i18n";

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

type ImportPageRun = Omit<CompanyImportRun, "manifestSummary"> & {
  manifestSummary?: Record<string, string> | CompanyImportRun["manifestSummary"] | null;
};

function importManifestSummary(value: ImportPageRun["manifestSummary"]): Record<string, string> | null {
  if (!value || typeof value !== "object") return null;

  return value;
}

export function toImportPageRun(run: ImportPageRun) {
  const manifestSummary = importManifestSummary(run.manifestSummary);
  const manifestVersion = manifestSummary?.operatelyVersion;
  const currentVersion = window.appConfig?.version;

  const showVersionWarning = Boolean(
    run.status === "failed" && manifestVersion && currentVersion && manifestVersion !== currentVersion,
  );

  return {
    ...run,
    companyPath: run.company ? Paths.companyHomePath(run.company.id) : null,
    manifestSummary: manifestSummary,
    showVersionWarning,
    versionWarning: i18n.t(
      "This package was exported from Operately {{manifestVersion}}, but this instance is running {{currentVersion}}. The import failure may be related to version differences.",
      { manifestVersion, currentVersion },
    ),
  };
}

export { useExportRuns, useImportRuns, useLoadExportDownload } from "./transferQueries";
export { useStartExport, useStartImport } from "./transferLifecycle";
