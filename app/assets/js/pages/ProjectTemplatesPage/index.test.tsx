import Api from "@/api";
import { loader } from "./loader";

jest.mock("@/api", () => ({
  __esModule: true,
  default: {
    project_templates: { list: jest.fn() },
    spaces: { list: jest.fn() },
  },
}));

const listTemplates = Api.project_templates.list as jest.Mock;
const listSpaces = Api.spaces.list as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  listTemplates.mockResolvedValue({ templates: [{ id: "template-1" }] });
  listSpaces.mockResolvedValue({
    spaces: [{ id: "space-1", name: "Marketing", permissions: { canEdit: true } }],
  });
});

test("loads all company templates and Spaces with effective permissions", async () => {
  const result = await loader({ params: { companyId: "acme" } } as any);

  expect(listTemplates).toHaveBeenCalledWith({ spaceId: null, archiveStatus: "all" });
  expect(listSpaces).toHaveBeenCalledTimes(1);
  expect(listSpaces).toHaveBeenCalledWith({ includePermissions: true });
  expect(result.fixedSpace).toBeNull();
});

test("loads a Space-scoped library and resolves the fixed Space", async () => {
  const result = await loader({ params: { companyId: "acme", id: "space-1" } } as any);

  expect(listTemplates).toHaveBeenCalledWith({ spaceId: "space-1", archiveStatus: "all" });
  expect(result.fixedSpace).toEqual({ id: "space-1", name: "Marketing", permissions: { canEdit: true } });
});
