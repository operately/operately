import Api from "@/api";
import { loader } from "./loader";

jest.mock("@/api", () => ({
  __esModule: true,
  default: {
    project_templates: { listQuery: jest.fn() },
    spaces: { listQuery: jest.fn() },
  },
}));

const listTemplates = Api.project_templates.listQuery as jest.Mock;
const listSpaces = Api.spaces.listQuery as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  listTemplates.mockResolvedValue({ templates: [{ id: "template-1" }] });
  listSpaces.mockResolvedValue({
    spaces: [{ id: "space-1", name: "Marketing", permissions: { canEdit: true } }],
  });
});

test("prefetches all company templates and Spaces with effective permissions", async () => {
  const result = await loader({ params: { companyId: "acme" } } as any);

  expect(listTemplates).toHaveBeenCalledWith({ spaceId: null, archiveStatus: "all" });
  expect(listSpaces).toHaveBeenCalledTimes(1);
  expect(listSpaces).toHaveBeenCalledWith({ includePermissions: true });
  expect(result.spaceId).toBeNull();
});

test("prefetches a Space-scoped library", async () => {
  const result = await loader({ params: { companyId: "acme", id: "space-1" } } as any);

  expect(listTemplates).toHaveBeenCalledWith({ spaceId: "space-1", archiveStatus: "all" });
  expect(result.spaceId).toBe("space-1");
});
