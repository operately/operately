import type { SpaceTools } from "@/api";
import { usePaths } from "@/routes/paths";
import { usePredictivePreloading } from "@/routes/preloading/PagePreloading";

export function useSpacePagePreloading({ spaceId, tools }: { spaceId: string; tools: SpaceTools }) {
  const paths = usePaths();
  const destinations = [paths.spaceWorkMapPath(spaceId)];

  if (tools.discussionsEnabled && tools.messagesBoards?.length) destinations.push(paths.discussionsPath(spaceId));
  if (tools.resourceHubEnabled) {
    for (const hub of tools.resourceHubs ?? []) destinations.push(paths.resourceHubPath(hub.id));
  }
  if (tools.tasksEnabled) destinations.push(paths.spaceKanbanPath(spaceId));
  if (tools.kpisEnabled) destinations.push(paths.spaceKpisPath(spaceId));
  if (tools.templatesEnabled) destinations.push(paths.spaceProjectTemplatesPath(spaceId));

  usePredictivePreloading(destinations);
}
