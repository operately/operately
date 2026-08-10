import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";

import { Templates } from "./Templates";

jest.mock("./components", () => ({
  Container: ({ path, testId, children }: any) => (
    <a href={path} data-test-id={testId}>
      {children}
    </a>
  ),
}));

jest.mock("turboui", () => ({ SpaceTemplatesTool: () => null }));

jest.mock("@/routes/paths", () => ({
  usePaths: () => ({ spaceProjectTemplatesPath: (id: string) => `/spaces/${id}/project-templates` }),
}));

describe("Templates space tool", () => {
  test("links the complete card to the space template library", () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <Templates space={{ id: "growth" } as any} templates={[]} />
      </MemoryRouter>,
    );

    expect(html).toContain('data-test-id="templates-tool"');
    expect(html).toContain('href="/spaces/growth/project-templates"');
  });
});
