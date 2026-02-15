import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { OtherPeople } from "../OtherPeople";
import { useBindedPeopleList } from "../loader";

// Mock the loader hook
vi.mock("../loader", () => ({
  useBindedPeopleList: vi.fn(),
}));

const mockUseBindedPeopleList = vi.mocked(useBindedPeopleList);

describe("OtherPeople", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders nothing when loading", () => {
    mockUseBindedPeopleList.mockReturnValue({
      people: undefined,
      loading: true,
    });

    const { container } = render(<OtherPeople />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when no people have access (company space case)", () => {
    mockUseBindedPeopleList.mockReturnValue({
      people: [],
      loading: false,
    });

    const { container } = render(<OtherPeople />);
    expect(container.firstChild).toBeNull();
  });

  it("renders condensed view when people have access", () => {
    const mockPeople = [
      { id: "1", fullName: "John Doe", accessLevel: 70 },
      { id: "2", fullName: "Jane Smith", accessLevel: 70 },
    ];

    mockUseBindedPeopleList.mockReturnValue({
      people: mockPeople,
      loading: false,
    });

    const { getByText } = render(<OtherPeople />);
    expect(getByText("2 other people have access to this space")).toBeInTheDocument();
    expect(getByText("show all")).toBeInTheDocument();
  });

  it("renders expanded view when show all is clicked", () => {
    const mockPeople = [
      { id: "1", fullName: "John Doe", accessLevel: 70 },
    ];

    mockUseBindedPeopleList.mockReturnValue({
      people: mockPeople,
      loading: false,
    });

    const { getByText, getByTestId } = render(<OtherPeople />);
    
    // Click show all
    getByText("show all").click();
    
    // Should now show the expanded view
    expect(getByTestId("other-people-list")).toBeInTheDocument();
    expect(getByText("Other People with Access")).toBeInTheDocument();
    expect(getByText("People who have access to the space via their company membeship.")).toBeInTheDocument();
  });
});