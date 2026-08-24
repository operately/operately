import React from "react";
import { AvatarList } from "../Avatar";
import { ContributorsSection, ContributorModal } from "../ContributorsSection";
import { PersonField } from "../PersonField";
import { SidebarSection } from "../SidebarSection";
import type { TemplateProjectPage } from ".";

export function TemplatePeople({ props, canEdit }: { props: TemplateProjectPage.Props; canEdit: boolean }) {
  const people = props.people ?? [];
  const champion = people.find((item) => item.role === "champion") ?? null;
  const reviewer = people.find((item) => item.role === "reviewer") ?? null;
  const contributors = people.filter((item) => item.role === "contributor");
  const [editing, setEditing] = React.useState<TemplateProjectPage.TemplatePerson | "new" | null>(null);

  if (people.length === 0 && !canEdit) return null;

  const setRole = (
    role: "champion" | "reviewer",
    current: TemplateProjectPage.TemplatePerson | null,
    person: PersonField.Person | null,
  ) => {
    if (!person && current) return props.onPersonUpdate?.(current.id, { role: "contributor" });
    if (!person) return;
    const representedPerson = people.find((item) => item.person?.id === person.id);
    if (representedPerson) return props.onPersonUpdate?.(representedPerson.id, { role });
    if (current) return props.onPersonUpdate?.(current.id, { person, role });
    return props.onPersonCreate?.({ person, role, responsibility: null, accessLevel: 100 });
  };

  return (
    <section data-test-id="template-people">
      <div className="space-y-6">
        <RoleField
          label="Champion"
          value={champion}
          canEdit={canEdit}
          searchData={props.personSearch}
          onChange={(person) => setRole("champion", champion, person)}
        />
        <RoleField
          label="Reviewer"
          value={reviewer}
          canEdit={canEdit}
          searchData={props.personSearch}
          onChange={(person) => setRole("reviewer", reviewer, person)}
        />

        <ContributorsSection
          contributors={contributors}
          canEdit={canEdit}
          onAdd={() => setEditing("new")}
          onEdit={(templatePerson) => setEditing(templatePerson)}
          onDelete={props.onPersonDelete}
          addButtonTestId="add-template-contributor"
          testIdPrefix="template-person"
        />
      </div>

      {editing && (
        <ContributorModal
          contributor={editing === "new" ? null : editing}
          searchData={props.contributorPersonSearch}
          onClose={() => setEditing(null)}
          onCreate={(values) => props.onPersonCreate?.({ ...values, role: "contributor" })}
          onUpdate={(id, updates) =>
            props.onPersonUpdate?.(id, updates.person ? { ...updates, role: "contributor" } : updates)
          }
          formTestId="template-contributor-form"
          accessMenuTestId="template-contributor-access"
        />
      )}
    </section>
  );
}

function RoleField({
  label,
  value,
  canEdit,
  searchData,
  onChange,
}: {
  label: string;
  value: TemplateProjectPage.TemplatePerson | null;
  canEdit: boolean;
  searchData: PersonField.SearchData;
  onChange: (person: PersonField.Person | null) => void;
}) {
  const field = canEdit ? (
    <PersonField
      person={value?.person ?? null}
      setPerson={onChange}
      searchData={searchData}
      emptyStateMessage={`Select ${label.toLowerCase()}`}
      emptyStateReadOnlyMessage={`No ${label.toLowerCase()}`}
    />
  ) : (
    <PersonField person={value?.person ?? null} readonly emptyStateReadOnlyMessage={`No ${label.toLowerCase()}`} />
  );

  return <SidebarSection title={label}>{field}</SidebarSection>;
}

export function TemplateTaskAssignees({ assignees }: { assignees: TemplateProjectPage.TemplatePerson[] }) {
  if (assignees.length === 0) return null;
  const people = assignees.flatMap((assignee) =>
    assignee.person ? [assignee.person] : [{ id: assignee.id, fullName: "Unavailable person", avatarUrl: null }],
  );
  return <AvatarList people={people} size="tiny" maxElements={4} stacked />;
}
