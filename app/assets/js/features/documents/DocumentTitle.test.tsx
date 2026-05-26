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

  it("renders the modified date when it differs from the posted date", () => {
    const html = renderToStaticMarkup(
      <DocumentTitle
        title="Quarterly Company Update"
        author={null}
        state="published"
        publishedAt="2026-05-13T12:00:00Z"
        modifiedAt="2026-05-14T12:00:00Z"
      />,
    );

    expect(html).toContain("Edited");
  });

  it("does not render the modified date when it matches the posted date", () => {
    const html = renderToStaticMarkup(
      <DocumentTitle
        title="Quarterly Company Update"
        author={null}
        state="published"
        publishedAt="2026-05-13T12:00:00Z"
        modifiedAt="2026-05-13T12:00:00Z"
      />,
    );

    expect(html).not.toContain("Edited");
  });
});
