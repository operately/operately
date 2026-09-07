export function updateTemplateCreationSearchParams(
  searchParams: URLSearchParams,
  isCreating: boolean,
): URLSearchParams {
  const nextSearchParams = new URLSearchParams(searchParams);

  if (isCreating) {
    nextSearchParams.set("new", "true");
  } else {
    nextSearchParams.delete("new");
  }

  return nextSearchParams;
}
