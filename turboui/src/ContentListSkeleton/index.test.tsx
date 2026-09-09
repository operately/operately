import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ContentListSkeleton } from ".";

it("announces loading once and hides the decorative rows", () => {
  const { container } = render(<ContentListSkeleton label="Loading discussions" />);
  expect(screen.getByRole("status", { name: "Loading discussions" })).toBeInTheDocument();
  const rows = container.querySelector('[aria-hidden="true"]');
  expect(rows?.children).toHaveLength(3);
  expect(rows).toHaveClass("motion-safe:animate-pulse");
});

it("supports document lists and a custom row count", () => {
  const { container } = render(<ContentListSkeleton leadingShape="document" count={2} />);
  expect(container.querySelector('[aria-hidden="true"]')?.children).toHaveLength(2);
  expect(container.querySelectorAll(".rounded-full")).toHaveLength(0);
});
