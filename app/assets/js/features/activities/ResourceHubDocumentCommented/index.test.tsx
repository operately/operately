import { usePaths } from "@/routes/paths";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import i18n, { applyLanguage } from "@/i18n";
import { resolveEffectiveLanguage } from "@/i18n/languages";
import type { Activity } from "@/models/activities";

import ResourceHubDocumentCommented from ".";

jest.mock("turboui", () => ({
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => <a href={to}>{children}</a>,
  Summary: () => null,
}));

jest.mock("@/routes/paths", () => ({
  usePaths: () => ({
    resourceHubDocumentPath: (id: string) => `/documents/${id}`,
    spacePath: (id: string) => `/spaces/${id}`,
  }),
}));

describe("ResourceHubDocumentCommented", () => {
  const portuguese = { ...i18n.getResourceBundle("pt-BR", "translation") };
  const activity = {
    author: { fullName: "Jo Smith" },
    content: {
      space: { id: "space-1", name: "General" },
      document: { id: "doc-1", name: "Research & <planning>" },
      comment: { id: "comment-1" },
    },
  } as Activity;

  function title(page: string) {
    return renderToStaticMarkup(
      <>{ResourceHubDocumentCommented.FeedItemTitle({ paths: usePaths(), activity, page })}</>,
    );
  }

  afterEach(async () => {
    i18n.removeResourceBundle("pt-BR", "translation");
    i18n.addResourceBundle("pt-BR", "translation", portuguese);
    await applyLanguage("en");
  });

  it.each([false, true])(
    "preserves English and names with a saved Portuguese preference (flag: %s)",
    async (enabled) => {
      i18n.removeResourceBundle("pt-BR", "translation");
      await applyLanguage(resolveEffectiveLanguage("pt-BR", enabled));
      const local =
        'Jo <a href="/documents/doc-1#comment-1">commented</a> on <a href="/documents/doc-1">Research &amp; &lt;planning&gt;</a>';
      expect(title("space")).toBe(local);
      expect(title("feed")).toBe(`${local} in the <a href="/spaces/space-1">General</a> space`);
      expect(ResourceHubDocumentCommented.NotificationTitle({ activity })).toBe("Re: Research & <planning>");
    },
  );

  it("looks up complete page-context sentences and keeps translated link text at its destination", async () => {
    i18n.addResourceBundle(
      "pt-BR",
      "translation",
      {
        "{{author}} <action>commented</action> on <document>{{documentName}}</document>":
          "LOCAL <document>{{documentName}}</document> — {{author}} <action>REPLY</action>",
        "{{author}} <action>commented</action> on <document>{{documentName}}</document> in the <parent>{{parentName}}</parent> space":
          "SPACE <parent>{{parentName}}</parent>: <document>{{documentName}}</document> — {{author}} <action>REPLY</action>",
        "Re: {{title}}": "REPLY: {{title}}",
      },
      true,
      true,
    );
    await applyLanguage("pt-BR");
    expect(title("space")).toBe(
      'LOCAL <a href="/documents/doc-1">Research &amp; &lt;planning&gt;</a> — Jo <a href="/documents/doc-1#comment-1">REPLY</a>',
    );
    expect(title("feed")).toBe(
      'SPACE <a href="/spaces/space-1">General</a>: <a href="/documents/doc-1">Research &amp; &lt;planning&gt;</a> — Jo <a href="/documents/doc-1#comment-1">REPLY</a>',
    );
    expect(ResourceHubDocumentCommented.NotificationTitle({ activity })).toBe("REPLY: Research & <planning>");
  });

  it("links the comment verb to the specific comment", () => {
    const activity: any = {
      author: { fullName: "Jo Smith" },
      content: {
        space: { id: "space-1", name: "General" },
        document: { id: "doc-1", name: "Start Here" },
        comment: { id: "comment-1" },
      },
    };

    const html = renderToStaticMarkup(
      <>{ResourceHubDocumentCommented.FeedItemTitle({ paths: usePaths(), activity, page: "space" })}</>,
    );

    expect(html).toContain('href="/documents/doc-1#comment-1"');
    expect(html).toContain(">commented</a>");
    expect(html).toContain('href="/documents/doc-1">Start Here</a>');
  });
});
