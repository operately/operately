import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import "@testing-library/jest-dom";

import { ActionLink, BlackLink, Link } from ".";
import { Tooltip } from "../Tooltip";

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>{ui}</MemoryRouter>);
}

describe("Link", () => {
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
