/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import Api from "@/api";
import PublicDocumentPageModule from ".";
import { PublicDocumentPage } from "turboui";

jest.mock("react-router", () => ({ useParams: jest.fn() }));
jest.mock("@tanstack/react-query", () => ({ useQuery: jest.fn() }));
jest.mock("@/api", () => ({
  __esModule: true,
  default: { documents: { getPublicQueryOptions: jest.fn(() => ({ queryKey: ["public-document"] })) } },
}));
jest.mock("@/contexts/TimezoneContext", () => ({ TimezoneProvider: ({ children }) => children }));
jest.mock("@/hooks/useFormattedTimePreferences", () => ({
  useFormattedTimePreferences: () => ({ locale: "en-US", timezone: "UTC", timeFormat: "automatic" }),
}));
jest.mock("turboui", () => ({ PublicDocumentPage: jest.fn(() => null) }));

test.each([
  [false, false],
  [true, false],
  [false, true],
])("public reader preserves refresh and access-loss handling: error=%s, pending=%s", (isError, isPending) => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  jest.mocked(useParams).mockReturnValue({ token: "literal-public-token" });
  const document = { name: "Literal title", content: "literal body" };
  jest.mocked(useQuery).mockReturnValue({ data: { document }, isError, isPending } as ReturnType<typeof useQuery>);
  const container = window.document.createElement("div");
  const root = createRoot(container);

  try {
    act(() => root.render(<PublicDocumentPageModule.Page />));

    expect(Api.documents.getPublicQueryOptions).toHaveBeenCalledWith({ token: "literal-public-token" });
    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        staleTime: 0,
        gcTime: 0,
        retry: false,
        refetchOnMount: "always",
        refetchInterval: 30_000,
      }),
    );
    expect(PublicDocumentPage).toHaveBeenLastCalledWith(
      expect.objectContaining({
        document: isError ? undefined : document,
        loading: isPending,
        formattedTimePreferences: { locale: "en-US", timezone: "UTC", timeFormat: "automatic" },
      }),
      expect.anything(),
    );
  } finally {
    act(() => root.unmount());
  }
});
