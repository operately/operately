import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ContentListState } from "./ContentListState";

it("replaces initial content with a loading skeleton", () => {
  const { rerender } = render(
    <ContentListState name="check-ins" loading>
      <div>Loaded cards</div>
    </ContentListState>,
  );
  expect(screen.getByRole("status")).toBeInTheDocument();
  expect(screen.queryByText("Loaded cards")).not.toBeInTheDocument();
  rerender(
    <ContentListState name="check-ins">
      <div>Loaded cards</div>
    </ContentListState>,
  );
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
  expect(screen.getByText("Loaded cards")).toBeInTheDocument();
});

it("offers retry and keeps cached content visible after a refresh failure", () => {
  const retry = jest.fn();
  render(
    <ContentListState name="discussions" error onRetry={retry}>
      <div>Cached cards</div>
    </ContentListState>,
  );
  expect(screen.getByRole("alert")).toBeInTheDocument();
  expect(screen.getByText("Cached cards")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  expect(retry).toHaveBeenCalledTimes(1);
});
