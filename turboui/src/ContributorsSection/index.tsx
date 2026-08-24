import React from "react";

import { SecondaryButton } from "../Button";
import { IconAlertTriangleFilled, IconEdit, IconPlus, IconTrash } from "../icons";
import { PersonField } from "../PersonField";
import { SidebarSection } from "../SidebarSection";

export interface Contributor {
  id: string;
  person: PersonField.Person | null;
  active?: boolean;
  responsibility?: string | null;
  accessLevel?: number;
}

export interface ContributorsSectionProps<T extends Contributor = Contributor> {
  contributors: T[];
  canEdit?: boolean;
  /** When false, contributors with full access cannot be removed. Defaults to true. */
  hasFullAccess?: boolean;
  onAdd?: () => void;
  onEdit?: (contributor: T) => void;
  onDelete?: (id: string) => void;
  addButtonTestId?: string;
  /** Prefix for person/edit/remove test ids (e.g. "template-person"). Defaults to "contributor". */
  testIdPrefix?: string;
}

const FULL_ACCESS_LEVEL = 100;

export function ContributorsSection<T extends Contributor>({
  contributors,
  canEdit = false,
  hasFullAccess = true,
  onAdd,
  onEdit,
  onDelete,
  addButtonTestId = "add-contributor",
  testIdPrefix = "contributor",
}: ContributorsSectionProps<T>) {
  return (
    <SidebarSection
      title={
        <div className="flex items-center gap-3">
          <span>Contributors</span>
          {canEdit && onAdd && (
            <SecondaryButton
              size="xxs"
              icon={IconPlus}
              iconSize={12}
              ariaLabel="Add contributor"
              onClick={onAdd}
              testId={addButtonTestId}
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
          contributors.map((contributor) => {
            const isActive = contributor.active !== false;
            const canRemove =
              Boolean(canEdit && onDelete) &&
              (hasFullAccess || (contributor.accessLevel ?? 0) < FULL_ACCESS_LEVEL);
            const menuOptions: NonNullable<PersonField.Props["extraDialogMenuOptions"]> = [];

            if (canEdit && onEdit) {
              menuOptions.push({
                icon: IconEdit,
                label: isActive ? "Edit contributor" : "Replace unavailable contributor",
                onClick: () => onEdit(contributor),
                testId: `edit-${testIdPrefix}-${contributor.id}`,
              });
            }

            if (canRemove) {
              menuOptions.push({
                icon: IconTrash,
                label: "Remove contributor",
                onClick: () => onDelete?.(contributor.id),
                testId: `remove-${testIdPrefix}-${contributor.id}`,
                danger: true,
              });
            }

            return (
              <div key={contributor.id} className="flex items-center gap-2 justify-between">
                <PersonField
                  person={contributor.person}
                  readonly
                  showTitle
                  emptyStateReadOnlyMessage="Unavailable person"
                  testId={`${testIdPrefix}-${contributor.id}`}
                  extraDialogMenuOptions={menuOptions.length > 0 ? menuOptions : undefined}
                />
                {!isActive && <UnavailableContributorLabel />}
              </div>
            );
          })
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

export { ContributorModal } from "./ContributorModal";
export type { ContributorFormValues, ContributorModalProps } from "./ContributorModal";

