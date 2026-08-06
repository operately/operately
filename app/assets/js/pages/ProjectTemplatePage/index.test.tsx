import Api from "@/api";
import { redirectIfFeatureNotEnabled } from "@/routes/redirectUtils";
import { loader } from "./loader";

jest.mock("@/api", () => ({
  __esModule: true,
  default: { project_templates: { get: jest.fn() } },
}));

jest.mock("@/routes/redirectUtils", () => ({ redirectIfFeatureNotEnabled: jest.fn() }));

const getTemplate = Api.project_templates.get as jest.Mock;
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
