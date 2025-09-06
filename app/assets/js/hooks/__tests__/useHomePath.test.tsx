import { renderHook } from "@testing-library/react";
import { useHomePath } from "../useHomePath";

// Mock the usePaths hook
const mockUsePaths = jest.fn();
jest.mock("@/routes/paths", () => ({
  usePaths: () => mockUsePaths(),
}));

// Mock useRouteLoaderData
const mockUseRouteLoaderData = jest.fn();
jest.mock("react-router-dom", () => ({
  useRouteLoaderData: (id: string) => mockUseRouteLoaderData(id),
}));

describe("useHomePath", () => {
  beforeEach(() => {
    mockUsePaths.mockClear();
    mockUseRouteLoaderData.mockClear();
  });

  it("should return root path when not in company context", () => {
    // Mock being outside company context (no data)
    mockUseRouteLoaderData.mockReturnValue(null);

    const { result } = renderHook(() => useHomePath());

    expect(result.current).toBe("/");
    expect(mockUsePaths).not.toHaveBeenCalled();
  });

  it("should return root path when company data is missing", () => {
    // Mock being in company context but no company data
    mockUseRouteLoaderData.mockReturnValue({ company: null });

    const { result } = renderHook(() => useHomePath());

    expect(result.current).toBe("/");
    expect(mockUsePaths).not.toHaveBeenCalled();
  });

  it("should return company home path when in valid company context", () => {
    // Mock being in valid company context
    mockUseRouteLoaderData.mockReturnValue({ company: { id: "test-company" } });
    mockUsePaths.mockReturnValue({
      homePath: () => "/test-company/home",
    });

    const { result } = renderHook(() => useHomePath());

    expect(result.current).toBe("/test-company/home");
    expect(mockUsePaths).toHaveBeenCalled();
  });

  it("should return root path as fallback when usePaths throws", () => {
    // Mock being in valid company context but usePaths throws
    mockUseRouteLoaderData.mockReturnValue({ company: { id: "test-company" } });
    mockUsePaths.mockImplementation(() => {
      throw new Error("usePaths error");
    });

    const { result } = renderHook(() => useHomePath());

    expect(result.current).toBe("/");
    expect(mockUsePaths).toHaveBeenCalled();
  });
});