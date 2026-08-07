import type { TemplateProjectPage } from "turboui";

export function activePersonIds(assignees: TemplateProjectPage.TemplatePerson[] | undefined) {
  return (assignees ?? []).flatMap((assignee) => (assignee.active && assignee.person ? [assignee.person.id] : []));
}
