import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { ResourcePageNavigation } from "./ResourcePageNavigation";

jest.mock("@/components/PaperContainer", () => ({
  Navigation: ({ items }: { items: { to: string; label: string }[] }) => (
    <nav>
      {items.map((item) => (
        <a key={item.to} href={item.to}>
          {item.label}
        </a>
      ))}
    </nav>
  ),
}));

jest.mock("@/routes/paths", () => ({
  usePaths: () => ({
    projectPath: (id: string) => `/projects/${id}`,
    resourceHubFolderPath: (id: string) => `/folders/${id}`,
    resourceHubPath: (id: string) => `/hubs/${id}`,
    spacePath: (id: string) => `/spaces/${id}`,
  }),
}));

describe("ResourcePageNavigation", () => {
  it("renders project resource hub breadcrumbs without requiring a space", () => {
    const link: any = {
      pathToLink: [],
      resourceHub: {
        id: "hub-1",
        name: "Documents & Files",
        project: {
          id: "project-1",
          name: "Launch",
        },
      },
    };

    const html = renderToStaticMarkup(<ResourcePageNavigation resource={link} />);

    expect(html).toContain('href="/projects/project-1">Launch</a>');
    expect(html).toContain('href="/hubs/hub-1">Documents &amp; Files</a>');
  });
});
