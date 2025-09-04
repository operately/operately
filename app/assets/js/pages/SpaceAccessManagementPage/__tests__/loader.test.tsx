import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useBindedPeopleList, useLoadedData } from "../loader";
import { useGetBindedPeople } from "@/api";

// Mock the dependencies
vi.mock("../loader", async () => {
  const actual = await vi.importActual("../loader");
  return {
    ...actual,
    useLoadedData: vi.fn(),
  };
});

vi.mock("@/api", () => ({
  useGetBindedPeople: vi.fn(),
}));

vi.mock("@/utils/assertions", () => ({
  assertPresent: vi.fn(),
}));

const mockUseLoadedData = vi.mocked(useLoadedData);
const mockUseGetBindedPeople = vi.mocked(useGetBindedPeople);

describe("useBindedPeopleList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns empty array for company spaces", () => {
    mockUseLoadedData.mockReturnValue({
      space: {
        id: "space-1",
        name: "General",
        isCompanySpace: true,
        members: [
          { id: "member-1", fullName: "John Doe" },
          { id: "member-2", fullName: "Jane Smith" },
        ],
      },
    });

    const { result } = renderHook(() => useBindedPeopleList());

    expect(result.current).toEqual({
      people: [],
      loading: false,
    });

    // Should not call the API for company spaces
    expect(mockUseGetBindedPeople).not.toHaveBeenCalled();
  });

  it("returns loading state for non-company spaces while loading", () => {
    mockUseLoadedData.mockReturnValue({
      space: {
        id: "space-1",
        name: "Marketing",
        isCompanySpace: false,
        members: [],
      },
    });

    mockUseGetBindedPeople.mockReturnValue({
      data: undefined,
      loading: true,
    });

    const { result } = renderHook(() => useBindedPeopleList());

    expect(result.current).toEqual({
      people: undefined,
      loading: true,
    });

    expect(mockUseGetBindedPeople).toHaveBeenCalledWith({
      resourseType: "space",
      resourseId: "space-1",
    });
  });

  it("filters out existing members for non-company spaces", () => {
    const spaceMembers = [
      { id: "member-1", fullName: "John Doe" },
      { id: "member-2", fullName: "Jane Smith" },
    ];

    const bindedPeople = [
      { id: "member-1", fullName: "John Doe" }, // Should be filtered out
      { id: "other-1", fullName: "Bob Wilson" }, // Should be included
      { id: "member-2", fullName: "Jane Smith" }, // Should be filtered out
      { id: "other-2", fullName: "Alice Cooper" }, // Should be included
    ];

    mockUseLoadedData.mockReturnValue({
      space: {
        id: "space-1",
        name: "Marketing",
        isCompanySpace: false,
        members: spaceMembers,
      },
    });

    mockUseGetBindedPeople.mockReturnValue({
      data: { people: bindedPeople },
      loading: false,
    });

    const { result } = renderHook(() => useBindedPeopleList());

    expect(result.current).toEqual({
      people: [
        { id: "other-1", fullName: "Bob Wilson" },
        { id: "other-2", fullName: "Alice Cooper" },
      ],
      loading: false,
    });
  });
});