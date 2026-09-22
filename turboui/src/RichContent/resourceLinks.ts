import type { ResourceLink, ResourceLinkType } from "../ApiTypes";

export type { ResourceLinkType };
export type ResourceLinkTitle = ResourceLink;

export interface ResourceLinkRef {
  type: ResourceLinkType;
  id: string;
}

export interface ResourceLinkParseOptions {
  origin: string;
  companyId: string;
}

const PATH_TYPES: Record<string, ResourceLinkType> = {
  tasks: "task",
  projects: "project",
  goals: "goal",
  milestones: "milestone",
  discussions: "discussion",
  documents: "document",
  links: "link",
  files: "file",
  folders: "folder",
  people: "person",
  spaces: "space",
};

export function collectResourceLinkRefs(content: unknown, options: ResourceLinkParseOptions): ResourceLinkRef[] {
  const refs: ResourceLinkRef[] = [];

  for (const document of asDocuments(content)) {
    walkContent(document, (href, text) => {
      if (!isUrlLabel(text, href)) return;

      const parsed = parseResourceLinkUrl(href, options);
      if (parsed) refs.push({ type: parsed.type, id: parsed.id });
    });
  }

  return uniqueRefs(refs);
}

export function applyResourceLinkTitles(
  content: unknown,
  titles: ResourceLinkTitle[],
  options?: Pick<ResourceLinkParseOptions, "origin">,
): unknown {
  if (!titles.length) return content;

  const parsed = parseDocument(content);
  if (!parsed) return content;

  return transformNode(parsed, titles, options?.origin);
}

export function parseResourceLinkUrl(
  href: string,
  options: ResourceLinkParseOptions,
): (ResourceLinkRef & { companyId: string }) | null {
  const url = parseHref(href, options.origin);
  if (!url) return null;

  const expectedOrigin = parseHref(options.origin, options.origin);
  if (!expectedOrigin || url.origin !== expectedOrigin.origin) return null;

  const parsed = parsePath(url);
  if (!parsed) return null;
  if (idKey(parsed.companyId) !== idKey(options.companyId)) return null;

  return parsed;
}

export function isUrlLabel(text: string, href: string): boolean {
  const normalizedText = normalizeUrlLabel(text);
  const normalizedHref = normalizeUrlLabel(href);

  if (normalizedText === normalizedHref) return true;

  try {
    const hrefUrl = new URL(href, "https://resource-link.invalid");
    const withoutQuery = `${hrefUrl.origin}${hrefUrl.pathname}`.replace(/\/$/, "");
    const pathOnly = hrefUrl.pathname.replace(/\/$/, "");

    return normalizedText === withoutQuery || normalizedText === pathOnly;
  } catch {
    return text.trim() === href.trim();
  }
}

function parseHref(href: string, origin: string): URL | null {
  try {
    return new URL(href, origin);
  } catch {
    return null;
  }
}

function parsePath(url: URL): (ResourceLinkRef & { companyId: string }) | null {
  const segments = url.pathname.split("/").filter(Boolean).map(stripFragment);
  if (segments.length === 4 && segments[1] === "spaces" && segments[3] === "kanban") {
    const taskId = url.searchParams.get("taskId");
    const companyId = segments[0];
    if (!companyId || !taskId) return null;

    return { companyId, type: "task", id: stripFragment(taskId) };
  }

  if (segments.length !== 3) return null;

  const [companyId, typeSegment, resourceId] = segments;
  const type = typeSegment ? PATH_TYPES[typeSegment] : undefined;
  if (!companyId || !type || !resourceId) return null;

  return { companyId, type, id: stripFragment(resourceId) };
}

function asDocuments(content: unknown): unknown[] {
  if (content == null) return [];
  return Array.isArray(content) ? content : [content];
}

function parseDocument(content: unknown): Record<string, unknown> | null {
  if (typeof content === "string") {
    try {
      const parsed = JSON.parse(content);
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch {
      return null;
    }
  }

  if (content && typeof content === "object") return content as Record<string, unknown>;
  return null;
}

function walkContent(content: unknown, visit: (href: string, text: string) => void) {
  const node = parseDocument(content);
  if (!node) return;

  walkNode(node, visit);
}

function walkNode(node: Record<string, unknown>, visit: (href: string, text: string) => void) {
  if (node.type === "text" && typeof node.text === "string") {
    const href = linkHref(node.marks);
    if (href) visit(href, node.text);
  }

  if (Array.isArray(node.content)) {
    for (const child of node.content) {
      if (child && typeof child === "object") walkNode(child as Record<string, unknown>, visit);
    }
  }
}

function transformNode(
  node: Record<string, unknown>,
  titles: ResourceLinkTitle[],
  origin?: string,
): Record<string, unknown> {
  const next: Record<string, unknown> = { ...node };

  if (Array.isArray(node.content)) {
    next.content = node.content.map((child) =>
      child && typeof child === "object" ? transformNode(child as Record<string, unknown>, titles, origin) : child,
    );
  }

  if (node.type === "text" && typeof node.text === "string") {
    const href = linkHref(node.marks);
    if (href && isUrlLabel(node.text, href)) {
      const ref = origin
        ? parseResourceLinkFromHref(href, origin)
        : parsePath(new URL(href, "https://resource-link.invalid"));
      const title = ref && findTitle(titles, ref);
      if (title) next.text = title;
    }
  }

  return next;
}

function parseResourceLinkFromHref(href: string, origin: string): ResourceLinkRef | null {
  const url = parseHref(href, origin);
  if (!url) return null;

  const expected = parseHref(origin, origin);
  if (!expected || url.origin !== expected.origin) return null;

  const parsed = parsePath(url);
  if (!parsed) return null;

  return { type: parsed.type, id: parsed.id };
}

function linkHref(marks: unknown): string | null {
  if (!Array.isArray(marks)) return null;

  for (const mark of marks) {
    if (isLinkMark(mark)) return mark.attrs.href;
  }

  return null;
}

function isLinkMark(mark: unknown): mark is { type: "link"; attrs: { href: string } } {
  if (!mark || typeof mark !== "object") return false;
  if (!("type" in mark) || mark.type !== "link") return false;
  if (!("attrs" in mark) || !mark.attrs || typeof mark.attrs !== "object") return false;
  return "href" in mark.attrs && typeof mark.attrs.href === "string";
}

function findTitle(titles: ResourceLinkTitle[], ref: ResourceLinkRef): string | null {
  const match = titles.find((title) => title.type === ref.type && idKey(title.id) === idKey(ref.id));
  return match?.title ?? null;
}

function uniqueRefs(refs: ResourceLinkRef[]): ResourceLinkRef[] {
  const seen = new Set<string>();
  const unique: ResourceLinkRef[] = [];

  for (const ref of refs) {
    const key = `${ref.type}:${idKey(ref.id)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(ref);
  }

  return unique;
}

function normalizeUrlLabel(value: string): string {
  try {
    const url = new URL(value, "https://resource-link.invalid");
    return `${url.origin}${url.pathname}${url.search}`.replace(/\/$/, "");
  } catch {
    return value.trim().replace(/\/$/, "");
  }
}

function stripFragment(value: string): string {
  return value.split("#")[0] ?? value;
}

function idKey(id: string): string {
  const parts = id.split("-");
  return parts[parts.length - 1] ?? id;
}
