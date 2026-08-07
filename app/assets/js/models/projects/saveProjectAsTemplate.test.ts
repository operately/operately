import type { ProjectTemplateScheduleIssue, ProjectTemplatesCreateFromProjectResult } from "@/api";
import { createSaveProjectAsTemplateHandler, mapScheduleIssue } from "./saveProjectAsTemplate";

const paths = {
  projectPath: (id: string) => `/projects/${id}`,
  projectMilestonePath: (id: string) => `/milestones/${id}`,
  taskPath: (id: string) => `/tasks/${id}`,
  projectTemplatePath: (id: string) => `/project-templates/${id}`,
};

describe("save project as template bridge", () => {
  it.each([
    ["project", "/projects/project-1"],
    ["milestone", "/milestones/milestone-1"],
    ["task", "/tasks/task-1"],
  ] as const)("maps %s schedule issues to resource links", (resourceType, expectedLink) => {
    const issue: ProjectTemplateScheduleIssue = {
      resourceType,
      resourceId: `${resourceType}-1`,
      resourceName: "Scheduled work",
      field: resourceType === "project" ? "end_date" : "due_date",
      date: "2028-01-09",
      reason: "before_project_start",
    };

    expect(mapScheduleIssue(issue, paths).link).toEqual(expectedLink);
  });

  it("navigates only after a successful committed response", async () => {
    const navigate = jest.fn();
    const createFromProject = jest.fn().mockResolvedValue({
      template: {
        __typename: "project_template",
        id: "template-1",
        name: "Reusable",
        space: { __typename: "space", id: "space-1", name: "Marketing" },
        insertedAt: "2028-01-10T00:00:00Z",
        updatedAt: "2028-01-10T00:00:00Z",
        milestoneCount: 0,
        taskCount: 0,
      },
      scheduleIssues: [],
    } satisfies ProjectTemplatesCreateFromProjectResult);
    const handler = createSaveProjectAsTemplateHandler({ projectId: "project-1", paths, createFromProject, navigate });

    expect(await handler(values())).toEqual({ success: true });
    expect(createFromProject).toHaveBeenCalledWith({ projectId: "project-1", name: "Reusable", description: null });
    expect(navigate).toHaveBeenCalledWith("/project-templates/template-1");
  });

  it("keeps the source page open for schedule and API failures", async () => {
    const navigate = jest.fn();
    const scheduleIssue: ProjectTemplateScheduleIssue = {
      resourceType: "task",
      resourceId: "task-1",
      resourceName: "Announce",
      field: "due_date",
      date: "2028-01-09",
      reason: "before_project_start",
    };
    const scheduleHandler = createSaveProjectAsTemplateHandler({
      projectId: "project-1",
      paths,
      navigate,
      createFromProject: jest.fn().mockResolvedValue({ template: null, scheduleIssues: [scheduleIssue] }),
    });

    const scheduleResult = await scheduleHandler(values());
    expect(scheduleResult.scheduleIssues?.[0]?.link).toEqual("/tasks/task-1");
    expect(navigate).not.toHaveBeenCalled();

    const failureHandler = createSaveProjectAsTemplateHandler({
      projectId: "project-1",
      paths,
      navigate,
      createFromProject: jest.fn().mockRejectedValue(new Error("network")),
    });
    expect(await failureHandler(values())).toEqual({
      success: false,
      error: "The template could not be created. Check the project and try again.",
    });
    expect(navigate).not.toHaveBeenCalled();
  });
});

function values() {
  return {
    name: " Reusable ",
    description: null,
    includePeopleAndAssignments: false,
    includeDiscussions: true,
    includeComments: false,
    includeDocsAndFiles: true,
  };
}
