import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { applyLanguage } from "@/i18n";
import { ZeroState } from "./ZeroState";

describe("ResourceHubs ZeroState", () => {
  afterEach(async () => {
    await applyLanguage("en");
  });

  it("translates the system default heading in the selected language", async () => {
    await applyLanguage("pt-BR");
    const html = renderToStaticMarkup(<ZeroState name="Documents & Files" />);
    expect(html).toContain("Docs &amp; Arquivos");
    expect(html).not.toContain("Documents &amp; Files");
  });

  it("preserves and escapes custom names even when they match another translation key", async () => {
    await applyLanguage("pt-BR");
    expect(renderToStaticMarkup(<ZeroState name="Save" />)).toContain(">Save<");
    expect(renderToStaticMarkup(<ZeroState name="Team <QA> & Files" />)).toContain("Team &lt;QA&gt; &amp; Files");
  });
});
