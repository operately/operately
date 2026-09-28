/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import { act, renderHook } from "@/__tests__/renderHook";
import { useForm } from "@/features/goals/GoalCheckIn/useForm";
import { Form } from "./Form";

const mockEdit = jest.fn();
let mockViewMode = true;
let mockForm: ReturnType<typeof useForm>;
const content = (checked: boolean) => ({
  type: "doc",
  content: [{ type: "taskList", content: [{ type: "taskItem", attrs: { checked } }] }],
});
let mockUpdate = {
  id: "check-in",
  insertedAt: "2026-09-01",
  state: "published",
  status: "on_track",
  message: JSON.stringify(content(false)),
};

// Share the app's React instance with the real TurboUI form state hook.
jest.mock("../../../../../turboui/node_modules/react", () => jest.requireActual("react"));
jest.mock("turboui", () => ({
  Forms: jest.requireActual("turboui/Forms/useForm"),
}));
jest.mock("@/features/goals/GoalCheckIn", () => ({
  useForm: jest.requireActual("@/features/goals/GoalCheckIn/useForm").useForm,
  Form: ({ form }) => {
    mockForm = form;
    return null;
  },
}));
jest.mock("./loader", () => ({
  useLoadedData: () => ({ update: mockUpdate, goal: { id: "goal", targets: [], checklist: [] } }),
}));
jest.mock("@/components/Pages", () => ({
  useIsViewMode: () => mockViewMode,
  useSetPageMode: () => jest.fn(),
}));
jest.mock("react-router", () => ({ useNavigate: () => jest.fn() }));
jest.mock("@/routes/paths", () => ({ usePaths: () => ({}) }));
jest.mock("@/models/richContent/taskListLifecycle", () => ({ useTaskList: () => ({ canEdit: true }) }));
jest.mock("@/models/goalCheckIns", () => ({
  useEditGoalProgressUpdate: () => ({ mutateAsync: mockEdit }),
  usePostGoalProgressUpdate: () => ({}),
}));
jest.mock("@/hooks/useScheduleFlow", () => ({ useScheduleFlow: () => ({}) }));

function renderForm() {
  return renderHook(() => null, {
    initialProps: undefined,
    wrapper: ({ children }) => (
      <>
        <Form />
        {children}
      </>
    ),
  });
}

beforeEach(() => {
  mockViewMode = true;
  mockUpdate = { ...mockUpdate, message: JSON.stringify(content(false)) };
  mockEdit.mockReset().mockResolvedValue({});
});

it("saves the refreshed checkbox state when opening Edit after a toggle", async () => {
  const view = renderForm();
  mockUpdate = { ...mockUpdate, message: JSON.stringify(content(true)) };
  view.rerender(undefined);
  mockViewMode = false;
  view.rerender(undefined);

  await act(async () => mockForm.actions.submit());

  expect(mockEdit).toHaveBeenCalledWith(expect.objectContaining({ content: JSON.stringify(content(true)) }));
});

it("preserves unsaved edits during background refreshes", () => {
  mockViewMode = false;
  const view = renderForm();
  const unsaved = { type: "doc", content: [{ type: "paragraph" }] };
  act(() => mockForm.actions.setValue("description", unsaved));
  mockUpdate = { ...mockUpdate, message: JSON.stringify(content(true)) };
  view.rerender(undefined);

  expect(mockForm.values.description).toEqual(unsaved);
});

it("starts a new edit session with current content after cancel", async () => {
  mockViewMode = false;
  const view = renderForm();
  act(() => mockForm.actions.setValue("description", { type: "doc", content: [] }));
  await act(async () => mockForm.actions.cancel());
  mockViewMode = true;
  view.rerender(undefined);
  mockUpdate = { ...mockUpdate, message: JSON.stringify(content(true)) };
  mockViewMode = false;
  view.rerender(undefined);

  expect(mockForm.values.description).toEqual(content(true));
});
