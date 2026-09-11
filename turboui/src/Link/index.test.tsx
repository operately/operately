import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import "@testing-library/jest-dom";

import { ActionLink, BlackLink, DimmedActionLink, Link } from ".";
import { Tooltip } from "../Tooltip";

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("Link", () => {
  it.each([ActionLink, DimmedActionLink])("prevents clicks when an action link is disabled (%#)", (Component) => {
    const onClick = jest.fn();
    render(
      <Component onClick={onClick} disabled>
        Resend code
      </Component>,
    );

    const button = screen.getByRole("button", { name: "Resend code" });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("renders actions as accessible buttons", () => {
    const onClick = jest.fn();

    render(<ActionLink onClick={onClick}>Add a goal</ActionLink>);

    fireEvent.click(screen.getByRole("button", { name: "Add a goal" }));
    expect(onClick).toHaveBeenCalled();
  });

  it("forwards refs to the underlying anchor", () => {
    const ref = React.createRef<HTMLAnchorElement>();

    renderWithRouter(
      <BlackLink ref={ref} to="/milestones/1" testId="black-link">
        Milestone
      </BlackLink>,
    );

    expect(ref.current).toBeInstanceOf(HTMLAnchorElement);
    expect(ref.current).toHaveAttribute("data-test-id", "black-link");
  });

  it("accepts refs when used as a Tooltip trigger", () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});

    renderWithRouter(
      <Tooltip content="View on board" size="sm">
        <BlackLink to="/projects/1?milestoneId=1" underline="hover">
          Board
        </BlackLink>
      </Tooltip>,
    );

    expect(screen.getByText("Board")).toBeInTheDocument();
    expect(consoleError).not.toHaveBeenCalledWith(
      expect.stringContaining("Function components cannot be given refs"),
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.anything(),
    );

    consoleError.mockRestore();
  });

  it("forwards refs from Link", () => {
    const ref = React.createRef<HTMLAnchorElement>();

    renderWithRouter(
      <Link ref={ref} to="/home" testId="styled-link">
        Home
      </Link>,
    );

    expect(ref.current).toHaveAttribute("data-test-id", "styled-link");
  });
});
