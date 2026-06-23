import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import LongDate from "./LongDate";

describe("LongDate", () => {
  const currentYear = new Date().getFullYear();

  test("renders English dates with the suffix on the day", () => {
    render(<LongDate time={new Date(currentYear, 4, 25)} locale="en-GB" />);

    expect(screen.getByText("May 25th")).toBeInTheDocument();
  });

  test("keeps non-English dates locale-aware without English suffixes", () => {
    const date = new Date(currentYear, 4, 25);
    const expected = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long" }).format(date);

    render(<LongDate time={date} locale="fr-FR" />);

    expect(screen.getByText(expected)).toBeInTheDocument();
  });
});
