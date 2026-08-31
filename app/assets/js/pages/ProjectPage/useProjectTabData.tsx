import Api, {
  type CommentThread,
  type Project,
  type ProjectCheckIn,
  type ResourceHub,
  type ResourceHubNode,
  type Task,
} from "@/api";
import * as React from "react";
import { useLocation } from "react-router";

import { PageCache } from "@/routes/PageCache";

export type ProjectPageTab = "tasks" | "check-ins" | "discussions" | "docs-and-files";

export type ProjectDocsAndFilesData = {
  resourceHub: ResourceHub;
  nodes: ResourceHubNode[];
  draftNodes: ResourceHubNode[];
};

type TabData = {
  tasks: Task[];
  checkIns: ProjectCheckIn[];
  discussions: CommentThread[];
  docsAndFiles: ProjectDocsAndFilesData | null;
};

export type ProjectTabState = {
  loading: boolean;
  error: boolean;
};

/** Cache keys for the Project shell and its independently loaded tab data. */
export function projectPageCacheKey(projectId: string): string {
  return `v12-ProjectV2Page.project-${projectId}`;
}

export function projectPageTabCacheKey(projectId: string, tab: ProjectPageTab): string {
  return `${projectPageCacheKey(projectId)}.${tab}`;
}

export function invalidateProjectPageCache(projectId: string): void {
  PageCache.invalidate(projectPageCacheKey(projectId));

  for (const tab of ["tasks", "check-ins", "discussions", "docs-and-files"] as const) {
    PageCache.invalidate(projectPageTabCacheKey(projectId, tab));
  }
}

/**
 * Loads the selected tab immediately, then warms the remaining tabs one at a time while idle.
 * Activity is intentionally excluded because it is fetched fresh when opened.
 */
export function useProjectTabData(project: Project) {
  const location = useLocation();
  const activeTab = activeProjectTab(location.search);
  const [data, setData] = React.useState<TabData>({ tasks: [], checkIns: [], discussions: [], docsAndFiles: null });
  const [states, setStates] = React.useState<Record<ProjectPageTab, ProjectTabState>>(() =>
    initialTabStates(activeTab),
  );
  // A tab switch can happen while its idle prefetch is in flight.
  const requests = React.useRef(new Map<ProjectPageTab, Promise<void>>());
  const loadedTabs = React.useRef(new Set<ProjectPageTab>());
  const projectId = project.id;
  const currentProjectId = React.useRef(projectId);
  currentProjectId.current = projectId;

  React.useEffect(() => {
    setData({ tasks: [], checkIns: [], discussions: [], docsAndFiles: null });
    setStates(initialTabStates(activeTab));
    requests.current.clear();
    loadedTabs.current.clear();
  }, [projectId]);

  const load = React.useCallback(
    (tab: ProjectPageTab, refreshCache = false): Promise<void> => {
      const requestedProjectId = projectId;
      if (loadedTabs.current.has(tab) && !refreshCache) return Promise.resolve();

      const activeRequest = requests.current.get(tab);
      if (activeRequest && !refreshCache) return activeRequest;

      setStates((current) => ({ ...current, [tab]: { loading: true, error: false } }));

      let request: Promise<void>;
      request = loadTab(project, tab, refreshCache)
        .then((result) => {
          if (currentProjectId.current !== requestedProjectId) return;
          loadedTabs.current.add(tab);
          setData((current) => ({ ...current, [tabDataKey(tab)]: result }));
          setStates((current) => ({ ...current, [tab]: { loading: false, error: false } }));
        })
        .catch((error) => {
          console.error(`Failed to load project ${tab}`, error);
          if (currentProjectId.current !== requestedProjectId) return;
          setStates((current) => ({ ...current, [tab]: { loading: false, error: true } }));
        })
        .finally(() => {
          if (requests.current.get(tab) === request) {
            requests.current.delete(tab);
          }
        });

      requests.current.set(tab, request);
      return request;
    },
    [project, projectId],
  );

  React.useEffect(() => {
    let cancelled = false;
    const tabs = prefetchTabs(activeTab);

    const prefetchNext = (index: number) => {
      if (cancelled || index >= tabs.length) return;

      scheduleWhenIdle(() => {
        if (cancelled) return;
        void load(tabs[index]!)
          .catch(() => undefined)
          .finally(() => prefetchNext(index + 1));
      });
    };

    // Start only one background tab request at a time.
    void load(activeTab).finally(() => prefetchNext(0));

    return () => {
      cancelled = true;
    };
  }, [activeTab, load]);

  const retry = React.useCallback((tab: ProjectPageTab) => load(tab, true), [load]);

  return { data, states, retry };
}

function activeProjectTab(search: string): ProjectPageTab {
  const tab = new URLSearchParams(search).get("tab");

  if (tab === "tasks" || tab === "check-ins" || tab === "discussions" || tab === "docs-and-files") {
    return tab;
  }

  return "tasks";
}

function prefetchTabs(activeTab: ProjectPageTab): ProjectPageTab[] {
  return (["tasks", "check-ins", "discussions", "docs-and-files"] as ProjectPageTab[]).filter(
    (tab) => tab !== activeTab,
  );
}

function initialTabStates(activeTab?: ProjectPageTab): Record<ProjectPageTab, ProjectTabState> {
  return {
    tasks: { loading: activeTab === "tasks", error: false },
    "check-ins": { loading: activeTab === "check-ins", error: false },
    discussions: { loading: activeTab === "discussions", error: false },
    "docs-and-files": { loading: activeTab === "docs-and-files", error: false },
  };
}

function scheduleWhenIdle(callback: () => void): void {
  const requestIdleCallback = (
    window as Window & { requestIdleCallback?: (callback: () => void, options: { timeout: number }) => void }
  ).requestIdleCallback;

  if (requestIdleCallback) {
    requestIdleCallback(callback, { timeout: 500 });
  } else {
    // Safari and older browsers do not implement requestIdleCallback.
    window.setTimeout(callback, 250);
  }
}

function tabDataKey(tab: ProjectPageTab): keyof TabData {
  if (tab === "check-ins") return "checkIns";
  if (tab === "docs-and-files") return "docsAndFiles";
  return tab;
}

async function loadTab(project: Project, tab: ProjectPageTab, refreshCache: boolean): Promise<TabData[keyof TabData]> {
  switch (tab) {
    case "tasks":
      return PageCache.fetch({
        cacheKey: projectPageTabCacheKey(project.id, tab),
        refreshCache,
        fetchFn: () => Api.tasks.list({ projectId: project.id, minimal: true }).then((response) => response.tasks),
      }).then((result) => result.data);
    case "check-ins":
      return PageCache.fetch({
        cacheKey: projectPageTabCacheKey(project.id, tab),
        refreshCache,
        fetchFn: () =>
          Api.projects
            .listCheckIns({ projectId: project.id, includeAuthor: true })
            .then((response) => response.projectCheckIns || []),
      }).then((result) => result.data);
    case "discussions":
      return PageCache.fetch({
        cacheKey: projectPageTabCacheKey(project.id, tab),
        refreshCache,
        fetchFn: () =>
          Api.projects.listDiscussions({ projectId: project.id }).then((response) => response.discussions || []),
      }).then((result) => result.data);
    case "docs-and-files":
      return loadDocsAndFiles(project, refreshCache);
  }
}

async function loadDocsAndFiles(project: Project, refreshCache: boolean): Promise<ProjectDocsAndFilesData> {
  const resourceHubId = project.resourceHub?.id;
  if (!resourceHubId) throw new Error("Project resource hub is missing");

  return PageCache.fetch({
    cacheKey: projectPageTabCacheKey(project.id, "docs-and-files"),
    refreshCache,
    fetchFn: async () => {
      const [resourceHub, nodes] = await Promise.all([
        Api.resource_hubs
          .get({
            id: resourceHubId,
            includeSpace: true,
            includeProject: true,
            includePermissions: true,
            includePotentialSubscribers: true,
          })
          .then((response) => response.resourceHub!),
        Api.resource_hubs.listNodes({ resourceHubId, includeCommentsCount: true, includeChildrenCount: true }),
      ]);

      return { resourceHub, nodes: nodes.nodes || [], draftNodes: nodes.draftNodes || [] };
    },
  }).then((result) => result.data);
}
