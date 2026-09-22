import { useSearchResults } from "@/models/search/useSearchResults";
import Api from "@/api";
import { parseMilestonesForTurboUi, type ParsedMilestoneForTurboUi } from "./index";
import { usePaths } from "@/routes/paths";

interface UseMilestonesResult {
  milestones: ParsedMilestoneForTurboUi[];
  search: (query: string) => Promise<void>;
}

export function useMilestones(projectId: string): UseMilestonesResult {
  const paths = usePaths();
  const search = useSearchResults((query) =>
    Api.projects.listMilestonesQueryOptions({ projectId, query: query.trim() }),
  );
  const parsed = parseMilestonesForTurboUi(paths, search.data?.milestones ?? []);

  return { milestones: parsed.orderedMilestones, search: search.onSearch };
}
