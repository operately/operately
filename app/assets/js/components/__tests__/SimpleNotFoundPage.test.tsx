import { render, screen } from "@testing-library/react";
import { SimpleNotFoundPage } from "../SimpleNotFoundPage";

// Mock turboui
jest.mock("turboui", () => ({
  GhostButton: ({ linkTo, testId, children }: any) => (
    <a href={linkTo} data-testid={testId}>
      {children}
    </a>
  ),
}));

describe("SimpleNotFoundPage", () => {
  it("should render 404 page with link to root path", () => {
    render(<SimpleNotFoundPage />);

    // Check for 404 text
    expect(screen.getByText("404")).toBeInTheDocument();
    expect(screen.getByText("Page Not Found")).toBeInTheDocument();
    expect(screen.getByText("Sorry, we couldn't find that page you were looking for.")).toBeInTheDocument();

    // Check for home link
    const homeLink = screen.getByTestId("back-to-lobby");
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute("href", "/");
    expect(homeLink).toHaveTextContent("Go back to Home");
  });
});