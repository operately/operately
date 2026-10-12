import Api, { Company, CuratedTemplate } from "@/api";
import { loader } from "./loader";

jest.mock("turboui", () => ({}));
jest.mock("@/components/Pages", () => ({}));
jest.mock("react-router", () => ({ redirect: (location: string) => ({ location }) }));

const template: CuratedTemplate = {
  __typename: "curated_template",
  id: "example",
  type: "goal",
  title: "Example",
  contentLanguage: "en",
  updatedAt: "2026-10-12T00:00:00Z",
};
const company = (id: string): Company => ({ __typename: "company", id, name: id, setupCompleted: true });

beforeEach(() => jest.restoreAllMocks());

test.each([
  { companies: [], location: "/new?redirect_to=%2Ftemplates%2Fexample%2Fuse" },
  { companies: [company("company")], location: "/company/templates/example/use" },
])("routes companies without creating resources: $location", async ({ companies, location }) => {
  jest.spyOn(Api.curated_templates, "getQuery").mockResolvedValue({ template });
  jest.spyOn(Api.companies, "listQuery").mockResolvedValue({ companies });
  const instantiate = jest.spyOn(Api.curated_templates, "instantiateMutationOptions");
  expect(await loader({ params: { templateId: "example" } })).toEqual({ location });
  expect(instantiate).not.toHaveBeenCalled();
});

test("multiple companies stay on the picker", async () => {
  jest.spyOn(Api.curated_templates, "getQuery").mockResolvedValue({ template });
  jest.spyOn(Api.companies, "listQuery").mockResolvedValue({ companies: [company("one"), company("two")] });
  expect(await loader({ params: { templateId: "example" } })).toEqual({
    templateInput: { id: "example" },
    companiesInput: {},
  });
});
