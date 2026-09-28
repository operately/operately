/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import { renderHook } from "@/__tests__/renderHook";
import { useRichEditorHandlers } from "./useRichEditorHandlers";
import { useRichTextHandlers } from "./useRichTextHandlers";
import { useSetTaskItemChecked } from "@/models/richContent/taskListLifecycle";

jest.mock("./useRichEditorHandlers", () => ({ useRichEditorHandlers: jest.fn() }));
jest.mock("@/models/richContent/taskListLifecycle", () => ({ useSetTaskItemChecked: jest.fn() }));

const editorHandlers = { mentionedPersonLookup: jest.fn(), uploadFile: jest.fn(), peopleSearch: jest.fn() };
const setTaskItemChecked = jest.fn().mockResolvedValue(undefined);
const change = { itemPath: [0, 0], checked: true, expectedContent: { type: "doc", content: [] } };

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useRichEditorHandlers).mockReturnValue(editorHandlers);
  jest.mocked(useSetTaskItemChecked).mockReturnValue(setTaskItemChecked);
});

it("preserves editor handlers and explicitly disables content toggles without a resource", () => {
  const { result } = renderHook(() => useRichTextHandlers({ taskList: null }), { initialProps: undefined });
  expect(result.current).toMatchObject({ ...editorHandlers, taskList: { canEdit: false } });
  expect(result.current.taskList.onChange).toBeUndefined();
  expect(setTaskItemChecked).not.toHaveBeenCalled();
});

it("uses the resource's edit permission and persists changes to that resource", async () => {
  const resource = {
    resourceType: "document" as const,
    resourceId: "document-1",
    field: "content" as const,
    canEdit: true,
  };
  const { result } = renderHook(() => useRichTextHandlers({ taskList: resource }), { initialProps: undefined });
  const { taskList } = result.current;
  expect(taskList.canEdit).toBe(true);
  if (!taskList.canEdit) throw new Error("Expected interactive task list");
  await taskList.onChange(change);
  expect(setTaskItemChecked).toHaveBeenCalledWith(resource, change);
});

it.each([
  [false, "comment"],
  [true, "template_comment"],
] as const)("persists comment toggles with templateComments=%s", async (templateComments, resourceType) => {
  const { result } = renderHook(() => useRichTextHandlers({ taskList: null, templateComments }), {
    initialProps: undefined,
  });
  const { onCommentTaskItemChange } = result.current;
  if (!onCommentTaskItemChange) throw new Error("Expected comment handler");
  await onCommentTaskItemChange("comment-1", change);
  expect(setTaskItemChecked).toHaveBeenCalledWith({ resourceType, resourceId: "comment-1", field: "content" }, change);
});
