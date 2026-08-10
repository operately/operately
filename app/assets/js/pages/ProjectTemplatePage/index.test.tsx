import Api from "@/api";
import { redirectIfFeatureNotEnabled } from "@/routes/redirectUtils";
import { loader } from "./loader";
import { activePersonIds } from "./people";
import { createTaskMove } from ".";

jest.mock("@/components/Pages", () => ({}));
jest.mock("@/hooks/useRichEditorHandlers", () => ({ useRichEditorHandlers: jest.fn() }));
jest.mock("@/models/people", () => ({}));
jest.mock("@/models/tasks", () => ({}));
jest.mock("@/routes/paths", () => ({
  Paths: { companyHomePath: (companyId: string) => `/${companyId}` },
  usePaths: jest.fn(),
}));
jest.mock("turboui", () => ({
  parseContent: jest.fn(),
  showErrorToast: jest.fn(),
  TemplateProjectPage: jest.fn(),
}));

jest.mock("@/api", () => ({
  __esModule: true,
  default: { project_templates: { get: jest.fn(), updateTask: jest.fn() } },
}));

jest.mock("@/routes/redirectUtils", () => ({ redirectIfFeatureNotEnabled: jest.fn() }));

const getTemplate = Api.project_templates.get as jest.Mock;
const updateTask = Api.project_templates.updateTask as jest.Mock;
const featureRedirect = redirectIfFeatureNotEnabled as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  featureRedirect.mockResolvedValue(undefined);
});

test("loads the complete template graph for the editor", async () => {
  const template = { id: "template-1", milestones: [{ id: "milestone-1" }], tasks: [{ id: "task-1" }] };
  getTemplate.mockResolvedValue({ template });

  await expect(loader({ params: { companyId: "acme", id: "template-1" } } as any)).resolves.toEqual({ template });
  expect(featureRedirect).toHaveBeenCalledWith(
    { companyId: "acme", id: "template-1" },
    { feature: "project_templates", path: "/acme" },
  );
  expect(getTemplate).toHaveBeenCalledWith({ id: "template-1" });
});

test("redirects home before loading the template when the feature is disabled", async () => {
  featureRedirect.mockRejectedValue(new Error("redirect"));

  await expect(loader({ params: { companyId: "acme", id: "template-1" } } as any)).rejects.toThrow("redirect");

  expect(getTemplate).not.toHaveBeenCalled();
});

test("sends only available people when replacing task assignees", () => {
  expect(
    activePersonIds([
      {
        id: "template-person-1",
        person: { id: "person-1", fullName: "Ada", avatarUrl: null },
        role: "contributor",
        responsibility: null,
        accessLevel: 70,
        active: true,
      },
      {
        id: "template-person-2",
        person: { id: "person-2", fullName: "Bob", avatarUrl: null },
        role: "contributor",
        responsibility: null,
        accessLevel: 70,
        active: false,
      },
    ]),
  ).toEqual(["person-1"]);
});

test("moves a task with its destination milestone and index in one request", async () => {
  updateTask.mockResolvedValue({ task: { id: "task-1" } });
  const mutate = jest.fn(async (_message: string, operation: () => Promise<unknown>) => {
    await operation();
    return true;
  });
  const moveTask = createTaskMove({ templateId: "template-1", mutate });

  await expect(moveTask("task-1", "milestone-2", 3)).resolves.toBe(true);

  expect(updateTask).toHaveBeenCalledWith({
    templateId: "template-1",
    taskId: "task-1",
    milestoneId: "milestone-2",
    index: 3,
  });
});

test("returns false when a task move fails", async () => {
  const mutate = jest.fn().mockResolvedValue(false);
  const moveTask = createTaskMove({ templateId: "template-1", mutate });

  await expect(moveTask("task-1", null, 0)).resolves.toBe(false);
});
