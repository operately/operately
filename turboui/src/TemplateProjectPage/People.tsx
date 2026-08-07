import React from "react";
import { AccessLevelBadge } from "../AccessLevelBadge";
import { Avatar, AvatarList } from "../Avatar";
import type { TemplateProjectPage } from ".";

export function TemplatePeople({ people }: { people: TemplateProjectPage.TemplatePerson[] }) {
  if (people.length === 0) return null;

  return (
    <section data-test-id="template-people">
      <h2 className="mb-2 text-sm font-bold">People</h2>
      <div className="space-y-3">
        {people.map((templatePerson) => (
          <div key={templatePerson.id} className="flex items-start gap-2">
            <Avatar person={templatePerson.person ?? { fullName: "Unavailable person" }} size="small" />
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-content-base">
                {templatePerson.person?.fullName ?? "Unavailable person"}
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs text-content-dimmed">
                <span>{roleLabel(templatePerson.role)}</span>
                <AccessLevelBadge accessLevel={templatePerson.accessLevel} size="xs" />
              </div>
              {templatePerson.responsibility && (
                <div className="mt-0.5 text-xs text-content-subtle">{templatePerson.responsibility}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function TemplateTaskAssignees({ assignees }: { assignees: TemplateProjectPage.TemplatePerson[] }) {
  if (assignees.length === 0) return null;

  const people = assignees.flatMap((assignee) =>
    assignee.person ? [assignee.person] : [{ id: assignee.id, fullName: "Unavailable person", avatarUrl: null }],
  );

  return <AvatarList people={people} size="tiny" maxElements={4} stacked />;
}

function roleLabel(role: TemplateProjectPage.TemplatePerson["role"]) {
  if (role === "champion") return "Champion";
  if (role === "reviewer") return "Reviewer";
  return "Contributor";
}
