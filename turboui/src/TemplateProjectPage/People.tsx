import React from "react";
import { AvatarList } from "../Avatar";
import { PrimaryButton, SecondaryButton } from "../Button";
import { IconAlertTriangleFilled, IconChevronDown, IconEdit, IconPlus, IconTrash } from "../icons";
import { Menu, MenuActionItem } from "../Menu";
import { Modal } from "../Modal";
import { PersonField } from "../PersonField";
import { SidebarSection } from "../SidebarSection";
import { TextField } from "../TextField";
import type { TemplateProjectPage } from ".";

const CONTRIBUTOR_ACCESS_LEVELS = [
  { value: 10, label: "View Access" },
  { value: 40, label: "Comment Access" },
  { value: 70, label: "Edit Access" },
  { value: 100, label: "Full Access" },
];

const FORM_FIELD_LABEL_CLASS = "mb-1 block text-left text-sm font-bold text-content-base";

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
          onEdit={setEditing}
          onDelete={props.onPersonDelete}
        />
      </div>

      {editing && (
        <ContributorModal
          templatePerson={editing === "new" ? null : editing}
          searchData={props.contributorPersonSearch}
          onClose={() => setEditing(null)}
          onCreate={props.onPersonCreate}
          onUpdate={props.onPersonUpdate}
        />
      )}
    </section>
  );
}

function ContributorsSection({
  contributors,
  canEdit,
  onAdd,
  onEdit,
  onDelete,
}: {
  contributors: TemplateProjectPage.TemplatePerson[];
  canEdit: boolean;
  onAdd: () => void;
  onEdit: (templatePerson: TemplateProjectPage.TemplatePerson) => void;
  onDelete?: TemplateProjectPage.Props["onPersonDelete"];
}) {
  return (
    <SidebarSection
      title={
        <div className="flex items-center gap-3">
          <span>Contributors</span>
          {canEdit && (
            <SecondaryButton
              size="xxs"
              icon={IconPlus}
              iconSize={12}
              ariaLabel="Add contributor"
              onClick={onAdd}
              testId="add-template-contributor"
              className="!px-0 !py-0"
            >
              {null}
            </SecondaryButton>
          )}
        </div>
      }
    >
      <div className="space-y-3">
        {contributors.length > 0 ? (
          contributors.map((templatePerson) => (
            <div key={templatePerson.id} className="flex items-center gap-2 justify-between">
              <PersonField
                person={templatePerson.person}
                readonly
                showTitle
                emptyStateReadOnlyMessage="Unavailable person"
                testId={`template-person-${templatePerson.id}`}
                extraDialogMenuOptions={
                  canEdit
                    ? [
                        {
                          icon: IconEdit,
                          label: templatePerson.active ? "Edit contributor" : "Replace unavailable contributor",
                          onClick: () => onEdit(templatePerson),
                          testId: `edit-template-person-${templatePerson.id}`,
                        },
                        {
                          icon: IconTrash,
                          label: "Remove contributor",
                          onClick: () => onDelete?.(templatePerson.id),
                          testId: `remove-template-person-${templatePerson.id}`,
                          danger: true,
                        },
                      ]
                    : undefined
                }
              />
              {!templatePerson.active && <UnavailableContributorLabel />}
            </div>
          ))
        ) : (
          <div className="text-sm text-content-dimmed">No contributors</div>
        )}
      </div>
    </SidebarSection>
  );
}

function UnavailableContributorLabel() {
  return (
    <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
      <IconAlertTriangleFilled size={14} />
      Not active
    </span>
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

function ContributorModal({
  templatePerson,
  searchData,
  onClose,
  onCreate,
  onUpdate,
}: {
  templatePerson: TemplateProjectPage.TemplatePerson | null;
  searchData: PersonField.SearchData;
  onClose: () => void;
  onCreate?: TemplateProjectPage.Props["onPersonCreate"];
  onUpdate?: TemplateProjectPage.Props["onPersonUpdate"];
}) {
  const isReplacingUnavailableContributor = Boolean(templatePerson && !templatePerson.active);
  const [person, setPerson] = React.useState(isReplacingUnavailableContributor ? null : (templatePerson?.person ?? null));
  const [responsibility, setResponsibility] = React.useState(templatePerson?.responsibility ?? "");
  const [accessLevel, setAccessLevel] = React.useState(templatePerson?.accessLevel ?? 70);
  const accessUpdateId = React.useRef(0);
  const accessLevelLabel = CONTRIBUTOR_ACCESS_LEVELS.find((level) => level.value === accessLevel)?.label;

  const updateAccessLevel = async (nextAccessLevel: number) => {
    if (nextAccessLevel === accessLevel) return;

    const previousAccessLevel = accessLevel;
    const updateId = ++accessUpdateId.current;
    setAccessLevel(nextAccessLevel);

    if (!templatePerson) return;

    const successful = (await onUpdate?.(templatePerson.id, { accessLevel: nextAccessLevel })) !== false;
    if (!successful && updateId === accessUpdateId.current) setAccessLevel(previousAccessLevel);
  };

  const save = async () => {
    if (!person) return;
    const successful = templatePerson
      ? await onUpdate?.(templatePerson.id, {
          person,
          role: "contributor",
          responsibility: responsibility || null,
          accessLevel,
        })
      : await onCreate?.({ person, role: "contributor", responsibility: responsibility || null, accessLevel });

    if (successful !== false) onClose();
  };

  const modalTitle = isReplacingUnavailableContributor
    ? "Replace unavailable contributor"
    : templatePerson
      ? "Edit contributor"
      : "Add contributor";
  const saveLabel = isReplacingUnavailableContributor ? "Replace contributor" : "Save contributor";

  return (
    <Modal isOpen onClose={onClose} title={modalTitle} size="small">
      <div className="space-y-5" data-test-id="template-contributor-form">
        <div>
          <label className={FORM_FIELD_LABEL_CLASS}>{isReplacingUnavailableContributor ? "Replacement" : "Person"}</label>
          {templatePerson && !isReplacingUnavailableContributor ? (
            <PersonField person={person} variant="form-field" readonly />
          ) : (
            <PersonField
              person={person}
              setPerson={setPerson}
              searchData={searchData}
              variant="form-field"
              emptyStateMessage={isReplacingUnavailableContributor ? "Select replacement" : "Select person"}
            />
          )}
        </div>
        <TextField
          variant="form-field"
          label="Responsibility"
          text={responsibility}
          onChange={setResponsibility}
          placeholder="What are they responsible for?"
        />
        <div>
          <label className={FORM_FIELD_LABEL_CLASS}>Access level</label>
          <Menu
            testId="template-contributor-access"
            customTrigger={
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-lg border border-surface-outline bg-surface-base px-3 py-1.5 text-left text-content-base hover:bg-surface-dimmed focus:outline-none focus:ring-2 focus:ring-primary-base"
              >
                <span>{accessLevelLabel ?? "Select access level"}</span>
                <IconChevronDown size={18} className="text-content-dimmed" />
              </button>
            }
            size="small"
          >
            {CONTRIBUTOR_ACCESS_LEVELS.map((level) => (
              <MenuActionItem
                key={level.value}
                testId={`template-contributor-access-${level.value}`}
                onClick={() => void updateAccessLevel(level.value)}
              >
                {level.label}
              </MenuActionItem>
            ))}
          </Menu>
        </div>
        <div className="flex justify-end gap-2">
          <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
          <PrimaryButton onClick={() => void save()} disabled={!person}>
            {saveLabel}
          </PrimaryButton>
        </div>
      </div>
    </Modal>
  );
}

export function TemplateTaskAssignees({ assignees }: { assignees: TemplateProjectPage.TemplatePerson[] }) {
  if (assignees.length === 0) return null;
  const people = assignees.flatMap((assignee) =>
    assignee.person ? [assignee.person] : [{ id: assignee.id, fullName: "Unavailable person", avatarUrl: null }],
  );
  return <AvatarList people={people} size="tiny" maxElements={4} stacked />;
}
