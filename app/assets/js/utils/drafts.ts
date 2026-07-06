type DraftableResource = {
  state: string;
  insertedAt: string;
  publishedAt?: string | null;
};

export function displayDate(resource: DraftableResource): string {
  if (resource.state === "draft") {
    return resource.insertedAt;
  }

  return resource.publishedAt ?? resource.insertedAt;
}
