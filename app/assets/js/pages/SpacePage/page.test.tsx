/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import axios from "axios";
import Api, { type Project } from "@/api";
import { waitFor } from "@/__tests__/renderHook";
import { Page } from "./page";
import { useLoadedData } from "./loader";
import { showErrorToast, showSuccessToast } from "turboui";

jest.mock("./useSpacePagePreloading", () => ({ useSpacePagePreloading: jest.fn() }));

const mockNavigate = jest.fn();

jest.mock("axios");
jest.mock("react-router", () => ({ useNavigate: () => mockNavigate }));
jest.mock("./loader", () => ({ useLoadedData: jest.fn() }));
jest.mock("@/routes/paths", () => ({
  compareIds: (a?: string, b?: string) => Boolean(a && b && a === b),
  usePaths: () => ({
    homePath: () => "/home",
    spaceEditPath: () => "/edit",
    spaceToolsConfigPath: () => "/tools",
    spaceAccessManagementPath: () => "/access",
  }),
}));
jest.mock("@/models/spaces", () => ({
  useDeleteSpace: () => jest.requireActual("@/models/spaces/spaceLifecycle").useDeleteSpace(),
  useJoinSpace: () => ({ mutateAsync: jest.fn(), isPending: false }),
}));
jest.mock("@/models/notifications/notificationLifecycle", () => ({ useReadNotificationsOnLoad: jest.fn() }));
jest.mock("@/features/Feed", () => ({ Feed: () => null, useFeedItemsQuery: () => ({}) }));
jest.mock("@/features/SpaceTools", () => ({ ToolsSection: () => null }));
jest.mock("@/components/Pages", () => ({ Page: ({ children }) => children, useWindowSizeBreakpoints: () => "md" }));
jest.mock("@/components/PaperContainer", () => ({
  Root: ({ children }) => children,
  Body: ({ children }) => children,
  DimmedSection: ({ children }) => children,
}));
jest.mock("@/components/PaperContainer/PageOptions", () => ({
  Root: ({ children }) => children,
  Link: () => null,
  Action: ({ onClick, testId }) => <button data-test-id={testId} onClick={onClick} />,
}));
jest.mock("turboui", () => ({
  AvatarList: () => null,
  SpacePrivacyIndicator: () => null,
  WarningCallout: () => null,
  Modal: ({ isOpen, children }) => (isOpen ? <div data-test-id="delete-modal">{children}</div> : null),
  SecondaryButton: ({ children, onClick, disabled }) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
  DangerButton: ({ onClick, loading, testId }) => <button onClick={onClick} disabled={loading} data-test-id={testId} />,
  showErrorToast: jest.fn(),
  showSuccessToast: jest.fn(),
}));

it.each([false, true])("handles failed deletion with confirmation=%s and allows retry", async (populated) => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  jest.clearAllMocks();
  Api.default.setBasePath("/api/v2");

  jest.mocked(useLoadedData).mockReturnValue({
    space: {
      __typename: "space",
      id: "space",
      name: "Space",
      isMember: true,
      members: [],
      permissions: {
        __typename: "space_permissions",
        hasFullAccess: true,
        canView: true,
        canEdit: true,
        canComment: true,
      },
    },
    tools: {
      __typename: "space_tools",
      tasksEnabled: false,
      discussionsEnabled: false,
      resourceHubEnabled: false,
      kpisEnabled: false,
      templatesEnabled: false,
      projects: populated ? [{ id: "project" } as Project] : [],
      goals: [],
      messagesBoards: [],
      resourceHubs: [],
      tasks: [],
      kpis: [],
      templates: [],
    },
  });

  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const container = document.createElement("div");
  const root = createRoot(container);
  const log = jest.spyOn(console, "error").mockImplementation(() => {});

  const click = async (testId: string) => {
    const button = container.querySelector<HTMLButtonElement>(`[data-test-id="${testId}"]`);
    expect(button).not.toBeNull();
    await act(async () => button?.click());
  };

  try {
    await act(async () =>
      root.render(
        <QueryClientProvider client={client}>
          <Page />
        </QueryClientProvider>,
      ),
    );

    jest.mocked(axios.post).mockRejectedValueOnce(new Error("Offline"));
    await click("delete-space");
    if (populated) await click("confirm-delete-space");

    await waitFor(() => expect(showErrorToast).toHaveBeenCalledTimes(1));
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(Boolean(container.querySelector('[data-test-id="delete-modal"]'))).toBe(populated);

    jest.mocked(axios.post).mockResolvedValueOnce({ data: { space: { id: "space" } } });
    await click(populated ? "confirm-delete-space" : "delete-space");

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/home"));
    expect(showSuccessToast).toHaveBeenCalledTimes(1);
  } finally {
    await act(async () => root.unmount());
    client.clear();
    log.mockRestore();
  }
});
