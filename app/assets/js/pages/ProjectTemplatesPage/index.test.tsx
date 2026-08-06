import Api from "@/api";
import { redirectIfFeatureNotEnabled } from "@/routes/redirectUtils";
import { loader } from "./loader";

jest.mock("@/api", () => ({
  __esModule: true,
  default: {
    project_templates: { list: jest.fn() },
    spaces: { list: jest.fn() },
  },
}));

jest.mock("@/routes/redirectUtils", () => ({ redirectIfFeatureNotEnabled: jest.fn() }));

const listTemplates = Api.project_templates.list as jest.Mock;
const listSpaces = Api.spaces.list as jest.Mock;
const featureRedirect = redirectIfFeatureNotEnabled as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  featureRedirect.mockResolvedValue(undefined);
  listTemplates.mockResolvedValue({ templates: [{ id: "template-1" }] });
  listSpaces
    .mockResolvedValueOnce({ spaces: [{ id: "space-1", name: "Marketing" }] })
    .mockResolvedValueOnce({ spaces: [{ id: "space-1", name: "Marketing" }] });
});

test("loads the active company library and editable Spaces", async () => {
  const result = await loader({ params: { companyId: "acme" } } as any);

  expect(featureRedirect).toHaveBeenCalledWith({ companyId: "acme" }, { feature: "project_templates", path: "/acme" });
  expect(listTemplates).toHaveBeenCalledWith({ spaceId: null, archiveStatus: "active" });
  expect(listSpaces).toHaveBeenNthCalledWith(1, {});
  expect(listSpaces).toHaveBeenNthCalledWith(2, { accessLevel: "edit_access" });
  expect(result.fixedSpace).toBeNull();
});

test("loads a Space-scoped library and resolves the fixed Space", async () => {
  const result = await loader({ params: { companyId: "acme", id: "space-1" } } as any);

  expect(listTemplates).toHaveBeenCalledWith({ spaceId: "space-1", archiveStatus: "active" });
  expect(result.fixedSpace).toEqual({ id: "space-1", name: "Marketing" });
});

test("redirects home before loading templates when the feature is disabled", async () => {
  featureRedirect.mockRejectedValue(new Error("redirect"));

  await expect(loader({ params: { companyId: "acme" } } as any)).rejects.toThrow("redirect");

  expect(listTemplates).not.toHaveBeenCalled();
  expect(listSpaces).not.toHaveBeenCalled();
});
