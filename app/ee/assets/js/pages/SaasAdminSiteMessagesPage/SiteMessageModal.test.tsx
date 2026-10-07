import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { applyLanguage, i18n, setupTestCatalog } from "@/__tests__/i18n";
import { SiteMessageModal } from "./SiteMessageModal";

setupTestCatalog();

jest.mock("@/ee/models/siteMessageLifecycle", () => ({
  useCreateSiteMessage: () => ({ mutateAsync: jest.fn() }),
  useUpdateSiteMessage: () => ({ mutateAsync: jest.fn() }),
  useSiteMessageCompanies: () => ({ data: { companies: [] }, isPending: false }),
}));

jest.mock("@/hooks/useRichEditorHandlers", () => ({ useRichEditorHandlers: () => ({}) }));

jest.mock("turboui", () => ({
  i18nOptions: jest.requireActual("../../../../../../turboui/src/i18nOptions").i18nOptions,
  emptyContent: () => ({}),
  IconSearch: () => null,
  Modal: ({ children }: React.PropsWithChildren) => children,
  Forms: {
    useForm: ({ fields }: { fields: Record<string, unknown> }) => ({ values: fields, errors: {} }),
    InputField: ({ children }: React.PropsWithChildren) => children,
    Form: ({ children }: React.PropsWithChildren) => children,
    FieldGroup: ({ children }: React.PropsWithChildren) => children,
    TextInput: ({ field, label }: { field: string; label: string }) => <label htmlFor={field}>{label}</label>,
    RichTextArea: () => null,
    SelectBox: () => null,
    Submit: () => null,
  },
}));

it.each([
  ["en", "Title"],
  ["pt-BR", "Título"],
])("renders the message title label in %s", async (language, label) => {
  await applyLanguage(language);

  const markup = renderToStaticMarkup(<SiteMessageModal isOpen onClose={jest.fn()} onSuccess={jest.fn()} />);

  expect(markup).toContain(`<label for="title">${label}</label>`);
  if (language === "pt-BR") expect(i18n.t("Title")).toBe("Cargo");
});
