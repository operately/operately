import { useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { match } from "ts-pattern";
import Api from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";
import { projectContentInputs } from "./contentQueries";
import { projectDocsInputs, prefetchProjectDocs } from "./docsQueries";

export function projectQueryInput(id: string) {
  return {
    id,
    includeGoal: true,
    includeChampion: true,
    includeReviewer: true,
    includePermissions: true,
    includeContributors: true,
    includeContributorsAccessLevels: true,
    includeMilestones: true,
    includeLastCheckIn: true,
    includePrivacy: true,
    includeAccessLevels: true,
    includeRetrospective: true,
    includeUnreadNotifications: true,
    includeSubscriptionList: true,
    includeResourceHub: true,
  };
}

export async function loader({ params, request }: { params: { id: string }; request?: Request }) {
  const projectInput = projectQueryInput(params.id);
  const childrenInput = { id: params.id };
  const contentInputs = projectContentInputs(params.id);

  const tab = request ? new URL(request.url).searchParams.get("tab") : null;

  const selectedContent = match(tab)
    .with("check-ins", () => Api.projects.listCheckInsQuery(contentInputs.checkInsInput))
    .with("discussions", () => Api.projects.listDiscussionsQuery(contentInputs.discussionsInput))
    .with("tasks", () => Api.tasks.listQuery(contentInputs.tasksInput))
    .otherwise(() => Promise.resolve());

  const core = Api.projects.getQuery(projectInput).then(async ({ project }) => {
    if (!project) throw new Error(`Project data is unavailable for project "${params.id}"`);
    await Promise.all([
      project.spaceId
        ? Api.spaces.getQuery({ id: project.spaceId, includePermissions: true }).catch(() => undefined)
        : Promise.resolve(),
      tab === "docs-and-files" ? prefetchProjectDocs(projectDocsInputs(project.resourceHub?.id)) : Promise.resolve(),
    ]);
  });

  await Promise.all([core, Api.projects.countChildrenQuery(childrenInput), selectedContent]);

  return { projectInput, childrenInput, ...contentInputs };
}

export type LoaderResult = Awaited<ReturnType<typeof loader>>;

export function useLoadedData() {
  const inputs = Pages.useLoadedData<LoaderResult>();
  const projectQuery = useLoadedQuery(Api.projects.getQueryOptions(inputs.projectInput));
  const childrenQuery = useLoadedQuery(Api.projects.countChildrenQueryOptions(inputs.childrenInput));
  
  const spaceId = projectQuery.data?.project?.spaceId;
  const spaceQuery = useLoadedQuery({
    ...Api.spaces.getQueryOptions({ id: spaceId ?? "", includePermissions: true }),
    enabled: Boolean(spaceId),
  });
  
  const project = projectQuery.data?.project;
  const childrenCount = childrenQuery.data?.childrenCount;
  const space = spaceId ? (spaceQuery.data?.space ?? null) : null;
  
  const data = useMemo(
    () => (project && childrenCount ? { project, childrenCount, space } : null),
    [project, childrenCount, space],
  );
  
  if (!data) throw new Error("Project page data is unavailable");
  
  return { ...inputs, data };
}

export function useRefreshCore() {
  const client = useQueryClient();
  const { projectInput, childrenInput } = Pages.useLoadedData<LoaderResult>();
  
  return useCallback(async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: Api.projects.getQueryKey(projectInput) }),
      client.invalidateQueries({ queryKey: Api.projects.countChildrenQueryKey(childrenInput) }),
      client.invalidateQueries({ queryKey: Api.spaces.getQueryKeyPrefix() }),
    ]);
  }, [client, projectInput, childrenInput]);
}
