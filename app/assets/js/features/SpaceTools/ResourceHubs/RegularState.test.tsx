import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { applyLanguage } from "@/i18n";
import type { ResourceHub } from "@/models/resourceHubs";
import { RegularState } from "./RegularState";

jest.mock("turboui", () => ({
  ...jest.requireActual("turboui"),
  NodeIcon: () => null,
}));

function resourceHub(name: string): ResourceHub {
  return {
    __typename: "resource_hub",
    id: "hub",
    name,
    nodes: [
      {
        __typename: "resource_hub_node",
        id: "node",
        type: "folder",
        name: "Team resources",
        folder: { __typename: "resource_hub_folder", id: "folder", name: "Team resources", childrenCount: 0 },
      },
    ],
  };
}

describe("ResourceHubs RegularState", () => {
  afterEach(async () => {
    await applyLanguage("en");
  });

  it("translates the system default heading in the selected language", async () => {
    await applyLanguage("pt-BR");
    const html = renderToStaticMarkup(<RegularState resourceHub={resourceHub("Documents & Files")} />);
    expect(html).toContain("Docs &amp; Arquivos");
    expect(html).not.toContain("Documents &amp; Files");
  });

  it("preserves and escapes custom names even when they match another translation key", async () => {
    await applyLanguage("pt-BR");
    const renderHeading = (name: string) => renderToStaticMarkup(<RegularState resourceHub={resourceHub(name)} />);

    expect(renderHeading("Save")).toContain(">Save<");
    expect(renderHeading("Team <QA> & Files")).toContain("Team &lt;QA&gt; &amp; Files");
  });
});
