export type DraftableResource = {
  state?: string | null;
  insertedAt?: string | null;
  publishedAt?: string | null;
};

export function displayDate(resource: DraftableResource): string {
  if (resource.state === "draft") {
    return resource.insertedAt ?? "";
  }

  return resource.publishedAt ?? resource.insertedAt ?? "";
}

type NodeWithDocument = {
  type?: string | null;
  insertedAt?: string | null;
  document?: DraftableResource | null;
};

export function nodeDisplayInsertedAt(node: NodeWithDocument): string | null {
  if (node.type === "document" && node.document) {
    return displayDate(node.document) || node.insertedAt || null;
  }

  return node.insertedAt ?? null;
}

export function withNodeDisplayInsertedAt<T extends NodeWithDocument>(node: T): T {
  const insertedAt = nodeDisplayInsertedAt(node);

  if (!insertedAt || insertedAt === node.insertedAt) {
    return node;
  }

  return { ...node, insertedAt };
}
