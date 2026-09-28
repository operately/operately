import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ContentListState } from ".";
import { i18n, setupTestCatalog } from "../../test/i18n";

setupTestCatalog();

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

test("translates loading accessibility text and retryable errors while retaining content", () => {
  i18n.addResourceBundle(
    "en",
    "translation",
    {
      "Loading discussions": "Translated loading discussions",
      "Unable to load discussions.": "Translated discussions failure",
      Retry: "Translated retry",
    },
    true,
    true,
  );
  const retry = jest.fn();
  const { rerender } = render(
    <ContentListState name="discussions" loading>
      Existing discussion
    </ContentListState>,
  );
  expect(screen.getByLabelText("Translated loading discussions")).toBeInTheDocument();
  rerender(
    <ContentListState name="discussions" error onRetry={retry}>
      Existing discussion
    </ContentListState>,
  );
  expect(screen.getByRole("alert")).toHaveTextContent("Translated discussions failure");
  expect(screen.getByText("Existing discussion")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Translated retry" }));
  expect(retry).toHaveBeenCalledTimes(1);
});
