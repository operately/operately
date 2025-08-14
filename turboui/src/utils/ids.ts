type ID = string | null | undefined;

export function compareIds(a: ID, b: ID) {
  if (!a || !b) return false;

  if (isUUID(a) && isUUID(b)) {
    return a === b;
  }

  return idWithoutComments(a) === idWithoutComments(b);
}

export function includesId(idsList: ID[], id: ID) {
  if (!id) return false;

  const ids = idsList
    .filter((id) => id)
    .map((id: string) => {
      if (isUUID(id)) return id;
      return idWithoutComments(id);
    });

  if (isUUID(id)) return ids.includes(id);
  return ids.includes(idWithoutComments(id));
}

function isUUID(id: string) {
  return id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
}

function idWithoutComments(id: string) {
  const parts = id.split("-");
  return parts[parts.length - 1];
}
