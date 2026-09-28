/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import type { Activity } from "@/api";
import { renderHook } from "@/__tests__/renderHook";
import handler from "./index";

const mockTaskList = jest.fn();
const mockEditLink = jest.fn();
let mockCanEdit = true;
jest.mock("@/pages/GoalActivityPage/loader", () => ({
  useLoadedData: () => ({ goal: { permissions: { canEdit: mockCanEdit } } }),
}));
jest.mock("@/contexts/CurrentCompanyContext", () => ({ useMe: () => ({ id: "another-editor" }) }));
jest.mock("@/routes/paths", () => ({
  compareIds: (a: string, b: string) => a === b,
  usePaths: () => ({ goalDiscussionEditPath: () => "/edit" }),
}));
jest.mock("@/components/PaperContainer/PageOptions", () => ({
  Root: ({ children }) => children,
  Link: (props) => {
    mockEditLink(props);
    return null;
  },
}));
jest.mock("@/hooks/useRichEditorHandlers", () => ({ useRichEditorHandlers: () => ({}) }));
jest.mock("@/models/richContent/taskListLifecycle", () => ({ useTaskList: (input) => mockTaskList(input) }));
jest.mock("turboui", () => ({ RichContent: () => null, isContentEmpty: () => false }));

it.each([true, false])(
  "uses goal edit access (%s) for both Edit and checkboxes, regardless of authorship",
  (canEdit) => {
    mockCanEdit = canEdit;
    jest.clearAllMocks();
    const activity = {
      id: "activity",
      author: { id: "author" },
      commentThread: { id: "discussion", message: "{}" },
    } as Activity;
    const Content = handler.PageContent;
    const Options = handler.PageOptions;
    renderHook(() => null, {
      initialProps: undefined,
      wrapper: ({ children }) => (
        <>
          <Content activity={activity} />
          <Options activity={activity} />
          {children}
        </>
      ),
    });

    expect(mockTaskList).toHaveBeenCalledWith(expect.objectContaining({ canEdit }));
    expect(mockEditLink).toHaveBeenCalledTimes(canEdit ? 1 : 0);
  },
);
