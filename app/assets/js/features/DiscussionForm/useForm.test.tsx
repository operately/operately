/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import { act, renderHook } from "@/__tests__/renderHook";
import { type Discussion, type Space } from "@/api";
import { useForm } from "./useForm";

const mockPost = jest.fn();
const mockEdit = jest.fn();
const mockNavigate = jest.fn();
let mockSubmit: (action?: string) => Promise<void>;
let mockScheduledAt: string | null = null;

jest.mock("react-router", () => ({ useNavigate: () => mockNavigate }));
jest.mock("@/routes/paths", () => ({
  usePaths: () => ({
    discussionPath: (id: string) => `/discussions/${id}`,
    spaceDiscussionsPath: (id: string) => `/spaces/${id}/discussions`,
  }),
}));
jest.mock("@/models/discussions", () => ({
  usePostDiscussion: () => ({ mutateAsync: mockPost }),
  useEditDiscussion: () => ({ mutateAsync: mockEdit }),
}));
jest.mock("@/models/subscriptions", () => ({
  useSubscriptionsAdapter: () => ({ notifyEveryone: false, currentSubscribersList: ["person1"] }),
}));
jest.mock("@/hooks/useScheduleFlow", () => ({
  useScheduleFlow: () => ({ isScheduledLocally: mockScheduledAt !== null, scheduledAtIso: mockScheduledAt }),
}));
jest.mock("turboui", () => ({
  emptyContent: () => ({ type: "doc", content: [] }),
  Forms: {
    useForm: (options) => {
      mockSubmit = options.submit;
      return { values: options.fields, state: "idle", actions: { setTrigger: jest.fn(), submit: options.submit } };
    },
  },
}));

const space = { id: "space1", name: "Space" } as Space;
const discussion = { id: "discussion1", title: "Title", body: null, state: "draft" } as Discussion;
const scheduledAt = "2030-01-02T15:00:00.000Z";

beforeEach(() => {
  jest.clearAllMocks();
  mockScheduledAt = null;
  mockPost.mockResolvedValue({ discussion });
  mockEdit.mockResolvedValue({ discussion });
});

it.each([
  ["post-message", null, false, undefined],
  ["post-draft", null, true, undefined],
  ["schedule", scheduledAt, false, scheduledAt],
  ["post-draft", scheduledAt, true, undefined],
] as const)("preserves create action %s with schedule %s", async (action, schedule, postAsDraft, expectedSchedule) => {
  mockScheduledAt = schedule;
  renderHook(() => useForm({ space, mode: "create" }), { initialProps: undefined });
  await act(() => mockSubmit(action));
  expect(mockPost).toHaveBeenCalledWith({
    spaceId: "space1",
    title: "",
    body: '{"type":"doc","content":[]}',
    postAsDraft,
    sendNotificationsToEveryone: false,
    subscriberIds: ["person1"],
    scheduledAt: expectedSchedule,
  });
  expect(mockNavigate).toHaveBeenCalledWith("/discussions/discussion1");
});

it.each([
  ["save-changes", "published", null, {}],
  ["save-changes", "draft", null, {}],
  ["save-changes", "scheduled", scheduledAt, { state: "scheduled", scheduledAt }],
  ["save-changes", "scheduled", null, {}],
  ["publish-draft", "draft", null, { state: "published" }],
  ["publish-draft", "draft", scheduledAt, { state: "scheduled", scheduledAt }],
  ["publish-now", "scheduled", scheduledAt, { state: "published", scheduledAt: null }],
  ["save-as-draft", "scheduled", scheduledAt, { state: "draft", scheduledAt: null }],
] as const)("preserves edit action %s for %s (%#)", async (action, state, schedule, changes) => {
  mockScheduledAt = schedule;
  renderHook(() => useForm({ space, mode: "edit", discussion: { ...discussion, state } }), { initialProps: undefined });
  await act(() => mockSubmit(action));
  expect(mockEdit).toHaveBeenCalledWith({
    id: "discussion1",
    title: "Title",
    body: '{"type":"doc","content":[]}',
    ...changes,
  });
  expect(mockNavigate).toHaveBeenCalledWith("/discussions/discussion1");
});

it("keeps the form open when saving fails", async () => {
  mockEdit.mockRejectedValueOnce(new Error("Failed"));
  renderHook(() => useForm({ space, mode: "edit", discussion }), { initialProps: undefined });
  await act(async () => {
    await expect(mockSubmit("save-changes")).rejects.toThrow("Failed");
  });
  expect(mockNavigate).not.toHaveBeenCalled();
});
