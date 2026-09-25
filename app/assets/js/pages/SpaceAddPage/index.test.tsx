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
afterEach(async () => {
  i18n.removeResourceBundle("en", "translation");
  i18n.addResourceBundle("en", "translation", english);
  await applyLanguage("en");
  jest.clearAllMocks();
});

it.each([
  ["en", "e.g. Marketing", "e.g. Create product awareness and bring new leads"],
  ["en", "Translated space example", "Translated purpose example"],
  ["pt-BR", "e.g. Marketing", "e.g. Create product awareness and bring new leads"],
])("looks up create-space examples with English fallback: %s / %s", async (language, name, purpose) => {
  i18n.addResourceBundle(
    "en",
    "translation",
    {
      "e.g. Marketing": name,
      "e.g. Create product awareness and bring new leads": purpose,
    },
    true,
    true,
  );
  await applyLanguage(language);
  renderHook(() => null, { initialProps: undefined, wrapper: page.Page });
  const fields = jest.mocked(Forms.TextInput).mock.calls.map(([props]) => props);
  expect(fields).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ field: "name", placeholder: name, required: true }),
      expect.objectContaining({ field: "mission", placeholder: purpose, required: true }),
    ]),
  );
});
