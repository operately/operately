import Api, { type DocumentsGetVersionResult } from "@/api";
import { useQuery } from "@tanstack/react-query";
import { type ComparisonStatus, type VersionSnapshot } from "turboui";

export function useVersionComparison(documentId: string, beforeNumber: number | null, afterNumber: number | null) {
  const before = useQuery({
    ...Api.documents.getVersionQueryOptions({ documentId, versionNumber: beforeNumber ?? 0 }),
    enabled: afterNumber !== null && beforeNumber !== null,
    staleTime: Infinity,
    select: parseSnapshot,
  });
  const after = useQuery({
    ...Api.documents.getVersionQueryOptions({ documentId, versionNumber: afterNumber ?? 0 }),
    enabled: afterNumber !== null,
    staleTime: Infinity,
    select: parseSnapshot,
  });

  let comparisonStatus: ComparisonStatus = "idle";

  if (afterNumber !== null) {
    if (after.data && (beforeNumber === null || before.data)) comparisonStatus = "ready";
    else if (after.isFetching || (beforeNumber !== null && before.isFetching)) comparisonStatus = "loading";
    else comparisonStatus = "error";
  }

  return {
    before: beforeNumber !== null ? (before.data ?? null) : null,
    after: afterNumber !== null ? (after.data ?? null) : null,
    comparisonStatus,
    onRetryComparison: async () => {
      await Promise.all([
        beforeNumber !== null && afterNumber !== null ? before.refetch() : undefined,
        afterNumber !== null ? after.refetch() : undefined,
      ]);
    },
  };
}

function parseSnapshot(result: DocumentsGetVersionResult): VersionSnapshot {
  const version = result.version;
  if (!version?.versionNumber) throw new Error("Document version is unavailable");

  let content: unknown = version.content;
  if (typeof content === "string") {
    try {
      content = JSON.parse(content);
    } catch {
      // Preserve blank or plain-text content from older versions.
    }
  }

  return {
    versionNumber: version.versionNumber,
    title: version.title ?? "",
    content,
    insertedAt: version.insertedAt ?? undefined,
  };
}
