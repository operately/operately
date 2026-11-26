/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import axios from "axios";
import { QueryClientProvider } from "@tanstack/react-query";
import Api from "@/api";
import { queryClient } from "@/api/queryClient";
import * as Pages from "@/components/Pages";
import { renderHook, waitFor } from "@/__tests__/renderHook";
import { preload, useLoadedData } from "./loader";

jest.mock("axios");
jest.mock("turboui", () => ({}));
jest.mock("@/components/Pages", () => ({ useLoadedData: jest.fn() }));

afterEach(() => queryClient.clear());

it.each([undefined, "product"])("recovers expired data when the map mounts (space %s)", async (id) => {
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({ "x-company-id": "acme" });
  jest.mocked(axios.get).mockImplementation(async (url) => ({
    data: url.endsWith("/work_maps/get_settings")
      ? { can_edit: true, default_view: null, ordered_item_ids: [], pinned_kpis: [] }
      : url.endsWith("/spaces/get")
        ? { space: { id, name: "Product" } }
        : { work_map: [] },
  }));
  const inputs = await preload({ params: { id } });
  jest.mocked(Pages.useLoadedData).mockReturnValue(inputs);
  const expiredKey = inputs.spaceInput
    ? Api.spaces.getQueryKey(inputs.spaceInput)
    : Api.companies.getWorkMapQueryKey(inputs.workMapInput);
  queryClient.removeQueries({ queryKey: expiredKey, exact: true });

  const { result } = renderHook(useLoadedData, {
    initialProps: undefined,
    wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
  });
  expect(result.current).toBeNull();
  await waitFor(() => expect(result.current).toMatchObject({ workMap: [], space: id ? { id } : undefined }));

  const settingsCalls = jest.mocked(axios.get).mock.calls.filter(([url, config]) => {
    const params = (config as { params?: { space_id?: string } } | undefined)?.params;
    return String(url).endsWith("/work_maps/get_settings") && params?.space_id === id;
  });
  expect(settingsCalls).toHaveLength(1);
  expect(settingsCalls[0]?.[1]).toEqual(
    expect.objectContaining({
      params: { ...(id && { space_id: id }), include_pinned_kpis: false },
    }),
  );
  expect(result.current?.settingsInput).toEqual(id ? { spaceId: id } : {});
});
