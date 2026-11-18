import { useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useDocumentUpdatedSignal } from "@/signals";
import { invalidateResourceHubQueries } from "./resourceHubLifecycle";

export function useDocumentUpdates(documentId: string) {
  const client = useQueryClient();
  const payload = useMemo(() => ({ documentId }), [documentId]);
  const refresh = useCallback(() => {
    void invalidateResourceHubQueries(client, { documentId });
  }, [client, documentId]);

  // Joining also catches changes saved between loading the page and subscribing,
  // or while the socket was disconnected. Cache updates keep draft inputs mounted.
  useDocumentUpdatedSignal(refresh, payload, refresh);
}
