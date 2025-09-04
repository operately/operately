import { render, screen } from "@testing-library/react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import ErrorPage from "../ErrorPage";

// Mock the ContextAwareNotFoundPage component
jest.mock("@/components/ContextAwareNotFoundPage", () => ({
  ContextAwareNotFoundPage: () => <div data-testid="context-aware-not-found">Context Aware 404 Page</div>,
}));

// Mock the useHomePath hook
jest.mock("@/hooks/useHomePath", () => ({
  useHomePath: () => "/",
}));

// Mock Sentry
jest.mock("@sentry/react", () => ({
  captureException: jest.fn(),
}));

// Mock turboui
jest.mock("turboui", () => ({
  GhostButton: ({ linkTo, testId, children }: any) => (
    <a href={linkTo} data-testid={testId}>
      {children}
    </a>
  ),
}));

// Mock useRouteError to control what error is returned
const mockUseRouteError = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useRouteError: () => mockUseRouteError(),
}));

describe("ErrorPage", () => {
  beforeEach(() => {
    mockUseRouteError.mockClear();
    
    // Mock window.appConfig for StackTrace component
    Object.defineProperty(window, "appConfig", {
      value: { environment: "test" },
      writable: true,
    });
  });

  it("should render ContextAwareNotFoundPage for 404 errors", () => {
    // Mock 404 error
    mockUseRouteError.mockReturnValue({ status: 404 });

    const router = createBrowserRouter([
      {
        path: "/",
        element: <div>Home</div>,
        errorElement: <ErrorPage />,
      },
    ]);

    render(<RouterProvider router={router} />);

    expect(screen.getByTestId("context-aware-not-found")).toBeInTheDocument();
    expect(screen.getByText("Context Aware 404 Page")).toBeInTheDocument();
  });

  it("should render ServerErrorPage for non-404 errors", () => {
    // Mock 500 error
    mockUseRouteError.mockReturnValue({ status: 500, stack: "Error stack trace" });

    const router = createBrowserRouter([
      {
        path: "/",
        element: <div>Home</div>,
        errorElement: <ErrorPage />,
      },
    ]);

    render(<RouterProvider router={router} />);

    expect(screen.getByText("500")).toBeInTheDocument();
    expect(screen.getByText("Oops! Something went wrong.")).toBeInTheDocument();
    expect(screen.getByText("An unexpected error has occurred.")).toBeInTheDocument();
    
    // Check for home link
    const homeLink = screen.getByTestId("back-to-lobby");
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute("href", "/");
  });
});