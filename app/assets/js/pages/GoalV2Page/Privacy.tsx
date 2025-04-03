import React from "react";

import { IconBuilding, IconTent } from "@tabler/icons-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import classNames from "classnames";
import Forms from "@/components/Forms";

import { PrivacyIndicator } from "@/features/Permissions";
import { Option } from "@/features/Permissions/AccessFields";
import { useIsEditMode, useIsViewMode } from "@/components/Pages";
import { capitalize } from "@/utils/strings";
import { assertPresent } from "@/utils/assertions";

import { useLoadedData } from "./loader";
import { Title } from "./components";

export function Privacy() {
  const isViewMode = useIsViewMode();

  if (isViewMode) {
    return <DisplayPrivacy />;
  } else {
    return <EditPrivacy />;
  }
}

function DisplayPrivacy() {
  const { goal } = useLoadedData();
  const isEditMode = useIsEditMode();

  assertPresent(goal.privacy, "privacy must be present in goal");
  const privacy = capitalize(goal.privacy);

  return (
    <div className="flex items-center gap-1">
      <Title title={privacy} />
      <PrivacyIndicator resource={goal} type="goal" size={18} disabled={isEditMode} />
    </div>
  );
}

function EditPrivacy() {
  const [companyMembersOptions] = Forms.useFieldValue<Option[]>("access.companyMembersOptions");
  const [spaceMembersOptions] = Forms.useFieldValue<Option[]>("access.spaceMembersOptions");

  const contentClass = classNames(
    "w-[420px]",
    "relative rounded-md mt-1",
    "p-4 shadow-lg ring-1 transition ring-surface-outline",
    "focus:outline-none",
    "bg-surface-base",
  );

  return (
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger asChild>
        <div role="button">
          <DisplayPrivacy />
        </div>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="z-40"
          side="top"
          align="end"
          alignOffset={90}
          sideOffset={10}
          avoidCollisions={false}
        >
          <DropdownMenu.Arrow className="relative left-[-90px]" />

          <div className={contentClass}>
            <Forms.FieldGroup>
              <Forms.SelectBox
                field="access.companyMembers"
                label="Company members"
                labelIcon={<IconBuilding size={20} />}
                options={companyMembersOptions}
              />
              <Forms.SelectBox
                field="access.spaceMembers"
                label="Space members"
                labelIcon={<IconTent size={20} />}
                options={spaceMembersOptions}
              />
            </Forms.FieldGroup>
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
