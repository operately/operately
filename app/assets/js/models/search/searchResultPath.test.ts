import type { SearchResult } from "@/api";
import { Paths } from "@/routes/paths";
import { searchResultPath } from "./searchResultPath";

function result(type: SearchResult["type"], navigationTarget: SearchResult["navigationTarget"]): SearchResult {
  return {
    __typename: "result",
    id: "result-1",
    type,
    title: "Result",
    context: "Context",
    matchedField: "title",
    snippet: null,
    state: null,
    insertedAt: "2026-07-28T12:00:00.000Z",
    navigationTarget,
  };
}

describe("searchResultPath", () => {
  const paths = new Paths({ companyId: "acme" });

  test.each([
    ["resource_hub_folder", { folderId: "folder-1" }, "/acme/folders/folder-1"],
    ["resource_hub_document", { documentId: "document-1" }, "/acme/documents/document-1"],
    ["resource_hub_file", { fileId: "file-1" }, "/acme/files/file-1"],
    ["resource_hub_link", { linkId: "link-1" }, "/acme/links/link-1"],
    ["project", { projectId: "project-1" }, "/acme/projects/project-1"],
    ["goal", { goalId: "goal-1" }, "/acme/goals/goal-1"],
    ["milestone", { milestoneId: "milestone-1" }, "/acme/milestones/milestone-1"],
    ["task", { taskId: "task-1", projectId: "project-1" }, "/acme/tasks/task-1"],
    ["person", { personId: "person-1" }, "/acme/people/person-1"],
    ["discussion", { discussionId: "discussion-1" }, "/acme/discussions/discussion-1"],
    ["project_check_in", { projectCheckInId: "check-in-1" }, "/acme/project-check-ins/check-in-1"],
    ["goal_check_in", { goalCheckInId: "check-in-1" }, "/acme/goal-check-ins/check-in-1"],
    ["project_retrospective", { projectId: "project-1" }, "/acme/projects/project-1/retrospective"],
  ] as const)("maps %s to its canonical path", (type, navigationTarget, expectedPath) => {
    expect(searchResultPath(paths, result(type, navigationTarget))).toEqual(expectedPath);
  });

  test("maps a space task to the space kanban", () => {
    expect(searchResultPath(paths, result("task", { taskId: "task-1", spaceId: "space-1" }))).toEqual(
      "/acme/spaces/space-1/kanban?taskId=task-1",
    );
  });

  test("prefers the project task page when both project and space are present", () => {
    expect(
      searchResultPath(paths, result("task", { taskId: "task-1", projectId: "project-1", spaceId: "space-1" })),
    ).toEqual("/acme/tasks/task-1");
  });

  test("rejects a result without its required navigation target", () => {
    expect(searchResultPath(paths, result("project", {}))).toBeNull();
  });
});
