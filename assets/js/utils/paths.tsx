export function createPath(...parts: any[]): string {
  if (parts.length === 0) return "/";

  const lastPart = parts[parts.length - 1];
  const rest = parts.slice(0, parts.length - 1);

  if (!lastPart) throw new Error("createPath does not accept empty parts");

  if (lastPart.constructor.name === "Object") {
    return createPathWithQuery(rest as string[], lastPart as Record<string, string>);
  } else {
    return createPathBase(parts as string[]);
  }
}

function createPathWithQuery(parts: string[], query: Record<string, string>): string {
  const base = createPathBase(parts);
  const queryString = createQuery(query);

  return `${base}${queryString}`;
}

function createPathBase(parts: string[]): string {
  if (parts.find((part) => part.constructor.name !== "String")) {
    throw new Error("createPath only accepts strings as parts");
  }

  if (parts.find((part) => part.includes("/"))) {
    throw new Error("createPath does not allow slashes in parts");
  }

  return "/" + Array.from(parts).join("/");
}

function createQuery(query: Record<string, string>): string {
  const queryParts = Object.entries(query).map(([key, value]) => `${key}=${value}`);

  return queryParts.length > 0 ? `?${queryParts.join("&")}` : "";
}
