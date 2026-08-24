import React from "react";

import { PrimaryButton, SecondaryButton } from "../Button";
import { IconChevronDown } from "../icons";
import { Menu, MenuActionItem } from "../Menu";
import { Modal } from "../Modal";
import { PersonField } from "../PersonField";
import { TextField } from "../TextField";

const CONTRIBUTOR_ACCESS_LEVELS = [
  { value: 10, label: "View Access" },
  { value: 40, label: "Comment Access" },
  { value: 70, label: "Edit Access" },
  { value: 100, label: "Full Access" },
];

const FULL_ACCESS_LEVEL = 100;
const FORM_FIELD_LABEL_CLASS = "mb-1 block text-left text-sm font-bold text-content-base";
const ACCESS_TRIGGER_CLASS =
  "flex w-full items-center justify-between rounded-lg border border-surface-outline bg-surface-base px-3 py-1.5 text-left text-content-base";

export interface ContributorFormValues {
  person: PersonField.Person;
  responsibility: string | null;
  accessLevel: number;
}

interface EditableContributor {
  id: string;
  person: PersonField.Person | null;
  active?: boolean;
  responsibility?: string | null;
  accessLevel?: number;
}

export interface ContributorModalProps {
  contributor: EditableContributor | null;
  searchData: PersonField.SearchData;
  onClose: () => void;
  onCreate?: (values: ContributorFormValues) => void | boolean | Promise<void | boolean>;
  onUpdate?: (
    contributorId: string,
    updates: Partial<ContributorFormValues>,
  ) => void | boolean | Promise<void | boolean>;
  formTestId?: string;
  accessMenuTestId?: string;
  allowFullAccess?: boolean;
}

export function ContributorModal({
  contributor,
  searchData,
  onClose,
  onCreate,
  onUpdate,
  formTestId = "contributor-form",
  accessMenuTestId = "contributor-access",
  allowFullAccess = true,
}: ContributorModalProps) {
  const isReplacingUnavailableContributor = Boolean(contributor && contributor.active === false);
  const [person, setPerson] = React.useState(isReplacingUnavailableContributor ? null : (contributor?.person ?? null));
  const [responsibility, setResponsibility] = React.useState(contributor?.responsibility ?? "");
  const [accessLevel, setAccessLevel] = React.useState(contributor?.accessLevel ?? 70);
  const accessLocked = !allowFullAccess && contributor?.accessLevel === FULL_ACCESS_LEVEL;
  const accessLevels = allowFullAccess
    ? CONTRIBUTOR_ACCESS_LEVELS
    : CONTRIBUTOR_ACCESS_LEVELS.filter((level) => level.value !== FULL_ACCESS_LEVEL);
  const accessLevelLabel = CONTRIBUTOR_ACCESS_LEVELS.find((level) => level.value === accessLevel)?.label;

  const save = async () => {
    if (!person) return;

    const values: ContributorFormValues = {
      person,
      responsibility: responsibility || null,
      accessLevel,
    };

    const successful = contributor
      ? await onUpdate?.(contributor.id, accessLocked ? { person, responsibility: values.responsibility } : values)
      : await onCreate?.(values);

    if (successful !== false) onClose();
  };

  const modalTitle = isReplacingUnavailableContributor
    ? "Replace unavailable contributor"
    : contributor
      ? "Edit contributor"
      : "Add contributor";
  const saveLabel = isReplacingUnavailableContributor ? "Replace contributor" : "Save contributor";

  return (
    <Modal isOpen onClose={onClose} title={modalTitle} size="small">
      <div className="space-y-5" data-test-id={formTestId}>
        <div>
          <label className={FORM_FIELD_LABEL_CLASS}>
            {isReplacingUnavailableContributor ? "Replacement" : "Person"}
          </label>
          {contributor && !isReplacingUnavailableContributor ? (
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
          testId="contributor-responsibility"
        />
        <div>
          <label className={FORM_FIELD_LABEL_CLASS}>Access level</label>
          {accessLocked ? (
            <div
              className={`${ACCESS_TRIGGER_CLASS} cursor-default`}
              data-test-id={accessMenuTestId}
              aria-readonly="true"
            >
              <span>{accessLevelLabel}</span>
            </div>
          ) : (
            <Menu
              testId={accessMenuTestId}
              customTrigger={
                <button
                  type="button"
                  data-test-id={accessMenuTestId}
                  className={`${ACCESS_TRIGGER_CLASS} hover:bg-surface-dimmed focus:outline-none focus:ring-2 focus:ring-primary-base`}
                >
                  <span>{accessLevelLabel ?? "Select access level"}</span>
                  <IconChevronDown size={18} className="text-content-dimmed" />
                </button>
              }
              size="small"
            >
              {accessLevels.map((level) => (
                <MenuActionItem
                  key={level.value}
                  testId={`${accessMenuTestId}-${level.value}`}
                  onClick={() => setAccessLevel(level.value)}
                >
                  {level.label}
                </MenuActionItem>
              ))}
            </Menu>
          )}
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
