import { render, screen } from "@testing-library/react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import ErrorPage from "../ErrorPage";

// Mock the SimpleNotFoundPage component since it uses external dependencies
jest.mock("@/components/SimpleNotFoundPage", () => ({
  SimpleNotFoundPage: () => <div data-testid="simple-not-found">Simple 404 Page</div>,
}));

// Mock the NotFoundPage component
jest.mock("@/pages/NotFoundPage", () => ({
  __esModule: true,
  default: {
    Page: () => <div data-testid="company-not-found">Company 404 Page</div>,
  },
}));

// Mock the usePaths hook
jest.mock("@/routes/paths", () => ({
  usePaths: () => ({
    homePath: () => "/test-company/home",
  }),
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

// Mock useRouteLoaderData to simulate different contexts
const mockUseRouteLoaderData = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useRouteLoaderData: () => mockUseRouteLoaderData(),
  useRouteError: () => ({ status: 404 }),
}));

describe("ErrorPage", () => {
  beforeEach(() => {
    mockUseRouteLoaderData.mockClear();
    
    // Mock window.appConfig for StackTrace component
    Object.defineProperty(window, "appConfig", {
      value: { environment: "test" },
      writable: true,
    });
  });

  it("should render SimpleNotFoundPage when not in company context", () => {
    // Mock being outside company context (no data)
    mockUseRouteLoaderData.mockReturnValue(null);

    const router = createBrowserRouter([
      {
        path: "/",
        element: <div>Home</div>,
        errorElement: <ErrorPage />,
      },
    ]);

    render(<RouterProvider router={router} />);

    expect(screen.getByTestId("simple-not-found")).toBeInTheDocument();
    expect(screen.getByText("Simple 404 Page")).toBeInTheDocument();
  });

  it("should render SimpleNotFoundPage when company data is missing", () => {
    // Mock being in company context but no company data
    mockUseRouteLoaderData.mockReturnValue({ company: null });

    const router = createBrowserRouter([
      {
        path: "/",
        element: <div>Home</div>,
        errorElement: <ErrorPage />,
      },
    ]);

    render(<RouterProvider router={router} />);

    expect(screen.getByTestId("simple-not-found")).toBeInTheDocument();
    expect(screen.getByText("Simple 404 Page")).toBeInTheDocument();
  });

  it("should render company NotFoundPage when in valid company context", () => {
    // Mock being in valid company context
    mockUseRouteLoaderData.mockReturnValue({ company: { id: "test-company" } });

    const router = createBrowserRouter([
      {
        path: "/",
        element: <div>Home</div>,
        errorElement: <ErrorPage />,
      },
    ]);

    render(<RouterProvider router={router} />);

    expect(screen.getByTestId("company-not-found")).toBeInTheDocument();
    expect(screen.getByText("Company 404 Page")).toBeInTheDocument();
  });
});