import { useCallback, useEffect, useState } from "react";
import Api from "@/api";
import { parseMilestonesForTurboUi } from "./index";
import { usePaths } from "@/routes/paths";
import { TaskPage } from "turboui";

interface UseMilestonesResult {
  milestones: TaskPage.Milestone[];
  search: (query: string) => Promise<void>;
}

export function useMilestones(projectId: string): UseMilestonesResult {
  const paths = usePaths();
  const [milestones, setMilestones] = useState<TaskPage.Milestone[]>([]);

  const search = useCallback(
    async (query: string) => {
      const data = await Api.projects.getMilestones({
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
