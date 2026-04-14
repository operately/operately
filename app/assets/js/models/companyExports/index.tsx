import { CompanyExportRun } from "@/api";

export const FEATURE_NAME = "company_transfers";

export function isActiveRun(run: CompanyExportRun) {
  return run.status === "pending" || run.status === "running";
}

export function sortRuns(runs: CompanyExportRun[]) {
  return [...runs].sort((a, b) => {
    const left = new Date(b.insertedAt).getTime();
    const right = new Date(a.insertedAt).getTime();
    return left - right;
  });
}

export function mergeRun(runs: CompanyExportRun[], nextRun: CompanyExportRun) {
  const filtered = runs.filter((run) => run.id !== nextRun.id);
  return sortRuns([nextRun, ...filtered]);
}
