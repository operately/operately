import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Api from "@/api";
import { compareIds } from "@/routes/paths";
import type { OtherPeopleWithAccessPerson } from "turboui";

interface UseProjectOtherPeopleWithAccessOptions {
  projectId: string;
  assignedPersonIds: (string | null | undefined)[];
}

/**
 * Loads people on request, then keeps the query subscribed for cache invalidations.
 * Filters out currently assigned people and retains cached results during refreshes.
 * Calling onRequestLoad again after a failure retries the query.
 */
export function useProjectOtherPeopleWithAccess({
  projectId,
  assignedPersonIds,
}: UseProjectOtherPeopleWithAccessOptions) {
  const [requestedProject, setRequestedProject] = useState<string | null>(null);
  const enabled = requestedProject === projectId;
  const query = useQuery({
    ...Api.people.getBindedQueryOptions({ resourseType: "project", resourseId: projectId }),
    enabled,
  });

  const people = useMemo<OtherPeopleWithAccessPerson[] | undefined>(() => {
    if (!enabled) return undefined;
    if (!query.data) return query.isError ? [] : undefined;

    return (query.data.people ?? []).flatMap((person) => {
      if (!person?.id || assignedPersonIds.some((id) => compareIds(id, person.id))) return [];
      return [
        { id: person.id, fullName: person.fullName, avatarUrl: person.avatarUrl, accessLevel: person.accessLevel ?? 0 },
      ];
    });
  }, [enabled, query.data, query.isError, assignedPersonIds]);

  const onRequestLoad = useCallback(() => {
    if (!enabled) setRequestedProject(projectId);
    else if (query.isError) void query.refetch();
  }, [enabled, projectId, query.isError, query.refetch]);

  return { people, loading: enabled && query.isLoading, onRequestLoad };
}
