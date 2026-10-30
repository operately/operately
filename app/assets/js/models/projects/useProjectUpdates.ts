import { useCallback, useEffect, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useProjectUpdatedSignal } from "@/signals";
import {
  cancelProjectPageQueries,
  invalidateProjectPageQueries,
  invalidateProjectResourceHubQueries,
} from "./projectPageQueries";

export function useProjectUpdates(projectId: string, resourceHubId: string | null | undefined) {
  const client = useQueryClient();
  const payload = useMemo(() => ({ projectId }), [projectId]);
  const pending = useRef(false);
  const refreshing = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(() => {
    pending.current = true;
    if (timer.current !== null) clearTimeout(timer.current);

    // Let mutation success handlers finish applying their optimistic state first.
    timer.current = setTimeout(() => {
      timer.current = null;
      if (client.isMutating() > 0) return;
      pending.current = false;
      refreshing.current += 1;
      void Promise.all([
        invalidateProjectPageQueries(client, projectId, "active"),
        resourceHubId ? invalidateProjectResourceHubQueries(client, resourceHubId) : Promise.resolve(),
      ]).finally(() => {
        refreshing.current -= 1;
      });
    }, 0);
  }, [client, projectId, resourceHubId]);

  useEffect(() => {
    const unsubscribe = client.getMutationCache().subscribe(() => {
      if (refreshing.current > 0 && client.isMutating() > 0) {
        // A save started after the refetch. Prevent its older response from
        // replacing the new optimistic state and reconcile after the save.
        pending.current = true;
        void cancelProjectPageQueries(client, projectId, resourceHubId);
      } else if (pending.current && client.isMutating() === 0) {
        refresh();
      }
    });

    return () => {
      unsubscribe();
      if (timer.current !== null) clearTimeout(timer.current);
      timer.current = null;
      pending.current = false;
    };
  }, [client, projectId, resourceHubId, refresh]);

  useProjectUpdatedSignal(refresh, payload, refresh);
}
