import Api from "@/api";
import { QueryClient } from "@tanstack/react-query";
import { invalidateProjectTemplateListQueries } from "./projectTemplateLifecycle";

describe("project template lifecycle queries", () => {
  beforeAll(() => {
    Api.default.setBasePath("/api/v2");
    Api.default.setHeaders({ "x-company-id": "company-1" });
  });

  it("invalidates project template lists without invalidating template details", async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const companyListKey = Api.project_templates.listQueryKey({ archiveStatus: "active" });
    const spaceListKey = Api.project_templates.listQueryKey({ spaceId: "space-1", archiveStatus: "all" });
    const templateKey = Api.project_templates.getQueryKey({ id: "template-1" });

    [companyListKey, spaceListKey, templateKey].forEach((queryKey) => queryClient.setQueryData(queryKey, {}));

    await invalidateProjectTemplateListQueries(queryClient);

    expect(queryClient.getQueryState(companyListKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(spaceListKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(templateKey)?.isInvalidated).toBe(false);
  });
});
