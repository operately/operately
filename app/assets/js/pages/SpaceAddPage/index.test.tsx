/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import { renderHook } from "@/__tests__/renderHook";
import i18n, { applyLanguage } from "@/i18n";
import { Forms } from "turboui";
import page from ".";

jest.mock("@/models/spaces", () => ({ useCreateSpace: () => ({ mutateAsync: jest.fn() }) }));
jest.mock("react-router", () => ({ useNavigate: () => jest.fn() }));
jest.mock("@/routes/paths", () => ({ usePaths: () => ({ homePath: () => "/home" }) }));
jest.mock("@/components/Pages", () => ({ Page: ({ children }) => children }));
jest.mock("@/components/PaperContainer", () => ({
  Root: ({ children }) => children,
  Body: ({ children }) => children,
  DimmedSection: ({ children }) => children,
  NavigateBack: () => null,
}));
jest.mock("turboui", () => ({
  Forms: {
    useForm: () => ({ errors: {}, actions: {} }),
    useFieldValue: () => [false, jest.fn()],
    Form: ({ children }) => children,
    FieldGroup: ({ children }) => children,
    TextInput: jest.fn(() => null),
    FormError: () => null,
    Submit: () => null,
  },
  useFormContext: () => ({}),
  SecondaryButton: () => null,
  AccessLevelSummary: () => null,
}));

const english = { ...i18n.getResourceBundle("en", "translation") };
const portuguese = { ...i18n.getResourceBundle("pt-BR", "translation") };
afterEach(async () => {
  for (const [language, resources] of [
    ["en", english],
    ["pt-BR", portuguese],
  ] as const) {
    i18n.removeResourceBundle(language, "translation");
    i18n.addResourceBundle(language, "translation", resources);
  }
  await applyLanguage("en");
  jest.clearAllMocks();
});

const nameKey = "e.g. Marketing";
const purposeKey = "e.g. Create product awareness and bring new leads";

function expectCreateSpacePlaceholders(name: string, purpose: string) {
  const fields = jest.mocked(Forms.TextInput).mock.calls.map(([props]) => props);
  expect(fields).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ field: "name", placeholder: name, required: true }),
      expect.objectContaining({ field: "mission", placeholder: purpose, required: true }),
    ]),
  );
}

it.each([
  ["e.g. Marketing", "e.g. Create product awareness and bring new leads"],
  ["Translated space example", "Translated purpose example"],
])("looks up create-space examples: %s", async (name, purpose) => {
  i18n.addResourceBundle("en", "translation", { [nameKey]: name, [purposeKey]: purpose }, true, true);
  await applyLanguage("en");
  renderHook(() => null, { initialProps: undefined, wrapper: page.Page });
  expectCreateSpacePlaceholders(name, purpose);
});

it("uses Portuguese catalog copy for create-space examples", async () => {
  await applyLanguage("pt-BR");
  renderHook(() => null, { initialProps: undefined, wrapper: page.Page });
  expectCreateSpacePlaceholders("Ex.: Marketing", "Ex.: Criar reconhecimento do produto e gerar novos leads");
});

it("falls back to English when Portuguese create-space examples are missing", async () => {
  i18n.removeResourceBundle("pt-BR", "translation");
  await applyLanguage("pt-BR");
  renderHook(() => null, { initialProps: undefined, wrapper: page.Page });
  expectCreateSpacePlaceholders(nameKey, purposeKey);
});
