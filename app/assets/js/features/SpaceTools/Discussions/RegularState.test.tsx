import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { RegularState } from "./RegularState";

describe("RegularState", () => {
  it("renders discussions without an author placeholder", () => {
    const html = renderToStaticMarkup(
      <RegularState
        space={{ id: "space-1", name: "Engineering" } as any}
        discussions={[
          {
            id: "discussion-1",
            title: "Imported discussion",
            body: JSON.stringify({ type: "doc", content: [] }),
            author: null,
            commentsCount: 2,
          } as any,
        ]}
      />
    );

    expect(html).toContain("Imported discussion");
    expect(html).not.toContain('title="?"');
  });
});
