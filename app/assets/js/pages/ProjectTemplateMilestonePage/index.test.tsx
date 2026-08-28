import Api from "@/api";
import { redirect } from "react-router";
import { loader } from "./loader";

jest.mock("@/api", () => ({
  __esModule: true,
  default: {
    project_templates: {
      get: jest.fn(),
    },
  },
}));

jest.mock("react-router", () => ({ redirect: jest.fn((path: string) => new Error(path)) }));

jest.mock("@/routes/paths", () => {
  class Paths {
    companyId: string;

    constructor({ companyId }: { companyId: string }) {
      this.companyId = companyId;
    }

    static companyHomePath(companyId: string) {
      return `/${companyId}`;
    }

    projectTemplatePath(templateId: string) {
      return `/${this.companyId}/project-templates/${templateId}`;
    }
  }

  return {
    Paths,
    compareIds: (left: string | null | undefined, right: string | null | undefined) => left === right,
  };
});

const getTemplate = Api.project_templates.get as jest.Mock;
const redirectTo = redirect as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  redirectTo.mockImplementation((path: string) => {
    const error = new Error(path);
    throw error;
  });
});

test("loads the template and selected milestone", async () => {
  const milestone = { id: "milestone-1", title: "Kickoff" };
  const template = { id: "template-1", milestones: [milestone], tasks: [] };
  getTemplate.mockResolvedValue({ template });

  await expect(
    loader({ params: { companyId: "acme", templateId: "template-1", id: "milestone-1" } } as any),
  ).resolves.toEqual({ template, milestone });

  expect(getTemplate).toHaveBeenCalledWith({ id: "template-1" });
});

test("redirects to the template page when the milestone is missing", async () => {
  getTemplate.mockResolvedValue({ template: { id: "template-1", milestones: [] } });

  await expect(
    loader({ params: { companyId: "acme", templateId: "template-1", id: "missing" } } as any),
  ).rejects.toThrow("/acme/project-templates/template-1");

  expect(redirectTo).toHaveBeenCalledWith("/acme/project-templates/template-1");
});
