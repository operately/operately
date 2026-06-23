import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import LongDate from "./LongDate";

describe("LongDate", () => {
  const currentYear = new Date().getFullYear();

  test("renders English dates with the suffix on the day", () => {
    const html = renderToStaticMarkup(<LongDate time={new Date(currentYear, 4, 25)} locale="en-GB" />);

    expect(html).toEqual("May 25th");
  });

  test("keeps non-English dates locale-aware without English suffixes", () => {
    const date = new Date(currentYear, 4, 25);
    const html = renderToStaticMarkup(<LongDate time={date} locale="fr-FR" />);

    expect(html).toEqual(new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long" }).format(date));
  });
});
