import type { Space } from "@/api";
import { includesId, usePaths } from "@/routes/paths";
import { usePredictivePreloading } from "@/routes/preloading/PagePreloading";

export function useHomePagePreloading({
  spaces,
  personId,
  enabled,
}: {
  spaces: Space[];
  personId: string;
  enabled: boolean;
}) {
  const paths = usePaths();
  const joinedSpaces = spaces.filter((space) =>
    includesId(
      (space.members ?? []).map((member) => member.id),
      personId,
    ),
  );

  usePredictivePreloading(
    enabled
      ? [
          paths.workMapPath(),
          paths.profilePath(personId),
          paths.reviewPath(),
          ...joinedSpaces.map((space) => paths.spacePath(space.id)),
        ]
      : [],
  );
}
