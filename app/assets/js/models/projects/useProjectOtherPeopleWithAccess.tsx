import * as React from "react";

import Api from "@/api";
import { compareIds } from "@/routes/paths";
import type { OtherPeopleWithAccessPerson } from "turboui";

interface UseProjectOtherPeopleWithAccessOptions {
  projectId: string;
  assignedPersonIds: (string | null | undefined)[];
}

export function useProjectOtherPeopleWithAccess({
  projectId,
  assignedPersonIds,
}: UseProjectOtherPeopleWithAccessOptions) {
  const [people, setPeople] = React.useState<OtherPeopleWithAccessPerson[] | undefined>(undefined);
  const [loading, setLoading] = React.useState(false);
  const requestedRef = React.useRef(false);
  const assignedIdsRef = React.useRef(assignedPersonIds);

  React.useEffect(() => {
    assignedIdsRef.current = assignedPersonIds;
  }, [assignedPersonIds]);

  const onRequestLoad = React.useCallback(() => {
    if (requestedRef.current) return;

    requestedRef.current = true;
    setLoading(true);

    Api.people
      .getBinded({ resourseType: "project", resourseId: projectId })
      .then((data) => {
        const assignedIds = assignedIdsRef.current.filter((id): id is string => Boolean(id));

        const filtered = (data.people || []).filter(
          (person) => person?.id && !assignedIds.some((id) => compareIds(id, person.id)),
        );

        setPeople(
          filtered.map((person) => ({
            id: person.id!,
            fullName: person.fullName,
            avatarUrl: person.avatarUrl,
            accessLevel: person.accessLevel ?? 0,
          })),
        );
      })
      .catch(() => {
        requestedRef.current = false;
        setPeople([]);
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  return { people, loading, onRequestLoad };
}
