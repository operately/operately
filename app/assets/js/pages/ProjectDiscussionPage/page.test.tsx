/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import { renderHook } from "@/__tests__/renderHook";
import { Page } from "./page";

const mockTaskList = jest.fn();
const mockEditLink = jest.fn();
let mockCanEdit = true;
jest.mock("./loader", () => ({
  useLoadedData: () => ({
    discussion: { id: "discussion", author: { id: "author" }, projectPermissions: { canEdit: mockCanEdit } },
  }),
  useRefresh: () => jest.fn(),
}));
jest.mock("@/contexts/CurrentCompanyContext", () => ({ useMe: () => ({ id: "another-editor" }) }));
jest.mock("@/routes/paths", () => ({
  compareIds: (a: string, b: string) => a === b,
  usePaths: () => ({ projectDiscussionEditPath: () => "/edit", workMapPath: () => "/work-map" }),
}));
jest.mock("@/components/Pages", () => ({ Page: ({ children }) => children }));
jest.mock("@/components/PaperContainer", () => ({
  Root: ({ children }) => children,
  Body: ({ children }) => children,
  Navigation: () => null,
}));
jest.mock("@/components/PaperContainer/PageOptions", () => ({
  Root: ({ children }) => children,
  Link: (props) => {
    mockEditLink(props);
    return null;
  },
}));
jest.mock("./DiscussionReactions", () => ({ DiscussionReactions: () => null }));
jest.mock("./Comments", () => ({ Comments: () => null }));
jest.mock("@/models/notifications/notificationLifecycle", () => ({ useReadNotificationsOnLoad: () => {} }));
jest.mock("@/models/subscriptions/useCurrentSubscriptionsQueryAdapter", () => ({
  useCurrentSubscriptionsQueryAdapter: () => ({}),
}));
jest.mock("@/hooks/useFormattedTimePreferences", () => ({ useFormattedTimePreferences: () => ({}) }));
jest.mock("@/hooks/useRichEditorHandlers", () => ({ useRichEditorHandlers: () => ({}) }));
jest.mock("@/models/richContent/taskListLifecycle", () => ({ useTaskList: (input) => mockTaskList(input) }));
jest.mock("turboui", () => ({ Avatar: () => null, RichContent: () => null, FormattedTime: () => null }));

it.each([true, false])(
  "uses project edit access (%s) for both Edit and checkboxes, regardless of authorship",
  (canEdit) => {
    mockCanEdit = canEdit;
    jest.clearAllMocks();
    renderHook(() => null, {
      initialProps: undefined,
      wrapper: ({ children }) => (
        <>
          <Page />
          {children}
        </>
      ),
    });

    expect(mockTaskList).toHaveBeenCalledWith(expect.objectContaining({ canEdit }));
    expect(mockEditLink).toHaveBeenCalledTimes(canEdit ? 1 : 0);
  },
);
