export const paths = {
  goalPath: (id: string, params?: { tab?: string }) => `/goals/${id}${params?.tab ? `?tab=${params.tab}` : ""}`,
  homePath: () => "/home",
  projectPath: (id: string, params?: { tab?: string }) => `/projects/${id}${params?.tab ? `?tab=${params.tab}` : ""}`,
  resourceHubDraftsPath: (id: string) => `/resource-hubs/${id}/drafts`,
  resourceHubDocumentPath: (id: string) => `/documents/${id}`,
  resourceHubEditDocumentPath: (id: string) => `/documents/${id}/edit`,
  resourceHubFilePath: (id: string) => `/files/${id}`,
  resourceHubFolderPath: (id: string) => `/folders/${id}`,
  resourceHubLinkPath: (id: string) => `/links/${id}`,
  resourceHubPath: (id: string) => `/resource-hubs/${id}`,
  spacePath: (id: string) => `/spaces/${id}`,
  spaceWorkMapPath: (id: string, tab?: string) => `/spaces/${id}/work-map${tab ? `?tab=${tab}` : ""}`,
} as any;

export function space(overrides = {}) {
  return {
    id: "space-1",
    name: "General",
    ...overrides,
  } as any;
}

export function goal(overrides = {}) {
  return {
    id: "goal-1",
    name: "Make operations repeatable",
    space: space(),
    ...overrides,
  } as any;
}

export function project(overrides = {}) {
  return {
    id: "project-1",
    name: "Improve paid acquisition conversion",
    space: space(),
    ...overrides,
  } as any;
}

export function resourceHub(overrides = {}) {
  return {
    id: "hub-1",
    name: "Documents & Files",
    goal: null,
    project: null,
    space: null,
    ...overrides,
  } as any;
}

export function document(overrides = {}) {
  return {
    id: "doc-1",
    name: "My doc",
    pathToDocument: [],
    resourceHub: resourceHub(),
    ...overrides,
  } as any;
}

export function file(overrides = {}) {
  return {
    id: "file-1",
    name: "Goal Checklist",
    pathToFile: [],
    resourceHub: resourceHub(),
    ...overrides,
  } as any;
}

export function link(overrides = {}) {
  return {
    id: "link-1",
    name: "Goal Tracker",
    pathToLink: [],
    resourceHub: resourceHub(),
    ...overrides,
  } as any;
}

export function folder(overrides = {}) {
  return {
    id: "folder-1",
    name: "Folder",
    pathToFolder: [],
    resourceHub: resourceHub(),
    ...overrides,
  } as any;
}
