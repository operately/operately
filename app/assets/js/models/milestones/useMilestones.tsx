import { useCallback, useEffect, useState } from "react";
import Api from "@/api";
import { parseMilestonesForTurboUi, type ParsedMilestoneForTurboUi } from "./index";
import { usePaths } from "@/routes/paths";

interface UseMilestonesResult {
  milestones: ParsedMilestoneForTurboUi[];
  search: (query: string) => Promise<void>;
}

export function useMilestones(projectId: string): UseMilestonesResult {
  const paths = usePaths();
  const [milestones, setMilestones] = useState<ParsedMilestoneForTurboUi[]>([]);

  const search = useCallback(
    async (query: string) => {
      const data = await Api.projects.listMilestones({
        projectId,
        query: query.trim(),
      });

      const parsed = parseMilestonesForTurboUi(paths, data.milestones || []);
      setMilestones(parsed.orderedMilestones);
    },
    [projectId, paths],
  );

  // Milestones are loaded on mount
  useEffect(() => {
    search("");
  }, [search]);

  return {
    milestones,
    search,
  };
}
