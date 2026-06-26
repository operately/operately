import MentionPeople, { SearchFn } from "./extensions/MentionPeople";

type MentionExtensionHandlers = {
  peopleSearch?: SearchFn;
};

export function mentionExtensions(handlers: MentionExtensionHandlers, editable: boolean | undefined) {
  const includeForReadOnlyDisplay = editable === false;
  const includeForMentionCreation = handlers.peopleSearch != null;

  if (!includeForReadOnlyDisplay && !includeForMentionCreation) {
    return [];
  }

  return [MentionPeople.configure(handlers.peopleSearch)];
}
