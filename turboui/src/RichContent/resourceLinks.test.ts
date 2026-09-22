import { applyResourceLinkTitles, collectResourceLinkRefs, isUrlLabel, parseResourceLinkUrl } from "./resourceLinks";

const origin = "https://app.operately.com";
const companyId = "acme-0abc";
const options = { origin, companyId };

function linkDoc(text: string, href: string) {
  return {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text,
            marks: [{ type: "link", attrs: { href, target: "_blank" } }],
          },
        ],
      },
    ],
  };
}

describe("resourceLinks", () => {
  describe("parseResourceLinkUrl", () => {
    it("extracts company, type, and id from recognized routes", () => {
      expect(parseResourceLinkUrl(`${origin}/${companyId}/projects/website-xyz`, options)).toEqual({
        companyId,
        type: "project",
        id: "website-xyz",
      });
    });

    it("accepts relative paths and space kanban task urls", () => {
      expect(parseResourceLinkUrl(`/${companyId}/goals/nps`, options)).toEqual({
        companyId,
        type: "goal",
        id: "nps",
      });

      expect(parseResourceLinkUrl(`${origin}/${companyId}/spaces/product/kanban?taskId=ship-it`, options)).toEqual({
        companyId,
        type: "task",
        id: "ship-it",
      });
    });

    it("rejects other origins, companies, and nested paths", () => {
      expect(parseResourceLinkUrl("https://other.example/acme-0abc/projects/website-xyz", options)).toBeNull();
      expect(parseResourceLinkUrl(`${origin}/other-0def/projects/website-xyz`, options)).toBeNull();
      expect(parseResourceLinkUrl(`${origin}/${companyId}/projects/website-xyz/pause`, options)).toBeNull();
    });
  });

  describe("collectResourceLinkRefs", () => {
    it("collects unique url-labeled resource links and ignores custom labels", () => {
      const href = `${origin}/${companyId}/projects/website-xyz`;
      const content = {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: href,
                marks: [{ type: "link", attrs: { href } }],
              },
              {
                type: "text",
                text: href,
                marks: [{ type: "link", attrs: { href: `${href}?tab=overview` } }],
              },
              {
                type: "text",
                text: "Custom label",
                marks: [{ type: "link", attrs: { href } }],
              },
              {
                type: "text",
                text: "https://example.com",
                marks: [{ type: "link", attrs: { href: "https://example.com" } }],
              },
            ],
          },
        ],
      };

      expect(collectResourceLinkRefs(content, options)).toEqual([{ type: "project", id: "website-xyz" }]);
    });
  });

  describe("applyResourceLinkTitles", () => {
    it("replaces url labels with titles and leaves custom labels and destinations unchanged", () => {
      const href = `${origin}/${companyId}/projects/website-xyz?tab=tasks#notes`;
      const content = linkDoc(href, href);
      const custom = linkDoc("Custom label", href);

      const titled = applyResourceLinkTitles(content, [{ type: "project", id: "website-xyz", title: "Website" }], {
        origin,
      }) as { content: { content: { text: string; marks: { attrs: { href: string } }[] }[] }[] };

      expect(titled.content[0]?.content[0]?.text).toBe("Website");
      expect(titled.content[0]?.content[0]?.marks[0]?.attrs.href).toBe(href);

      const unchanged = applyResourceLinkTitles(custom, [{ type: "project", id: "website-xyz", title: "Website" }], {
        origin,
      }) as { content: { content: { text: string }[] }[] };

      expect(unchanged.content[0]?.content[0]?.text).toBe("Custom label");
      expect(content.content[0]?.content[0]?.text).toBe(href);
    });

    it("keeps the original url when no title is available", () => {
      const href = `${origin}/${companyId}/projects/website-xyz`;
      const content = linkDoc(href, href);

      expect(applyResourceLinkTitles(content, [], { origin })).toBe(content);
    });
  });

  describe("isUrlLabel", () => {
    it("treats the href and href without hash as url labels", () => {
      const href = `${origin}/${companyId}/projects/website-xyz?tab=tasks#notes`;

      expect(isUrlLabel(href, href)).toBe(true);
      expect(isUrlLabel(`${origin}/${companyId}/projects/website-xyz?tab=tasks`, href)).toBe(true);
      expect(isUrlLabel("Website", href)).toBe(false);
    });
  });
});
