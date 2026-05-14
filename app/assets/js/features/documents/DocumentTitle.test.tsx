import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { DocumentTitle } from "./DocumentTitle";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("DocumentTitle", () => {
  it("renders without an author", () => {
    const html = renderToStaticMarkup(
      <DocumentTitle
        title="Quarterly Company Update"
        author={null}
        state="published"
        publishedAt="2026-05-13T12:00:00Z"
      />,
    );

    expect(html).toContain("Quarterly Company Update");
    expect(html).toContain("Posted");
    expect(html).not.toContain('title="?"');
  });
});
