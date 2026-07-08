import * as React from "react";

import { IconBuilding, IconTent } from "../icons";
import { useFieldValue } from "./context";
import { FieldGroup } from "./FieldGroup";
import { SelectBox } from "./SelectBox";
import type { AccessSelectorsProps, SelectBoxOption } from "./types";

export const ACCESS_NO_ACCESS_VALUE = 0;

export function AccessSelectors({
  fieldPrefix = "access",
  showSpaceAccess = true,
  noAccessValue = ACCESS_NO_ACCESS_VALUE,
}: AccessSelectorsProps) {
  const [companyMembersOptions] = useFieldValue<SelectBoxOption[]>(`${fieldPrefix}.companyMembersOptions`);
  const [spaceMembersOptions] = useFieldValue<SelectBoxOption[]>(`${fieldPrefix}.spaceMembersOptions`);
  const companyOptions = companyMembersOptions ?? [];
  const spaceOptions = spaceMembersOptions ?? [];

  // Only hide the company selector on company-only forms (e.g. space general access),
  // where the sole available option is no-access. When the space selector is shown,
  // keep company visible so users can raise space access and then company access.
  const hideCompany = !showSpaceAccess && shouldHideCompanySelector(companyOptions, noAccessValue);

  const companySelect = (
    <SelectBox
      field={`${fieldPrefix}.companyMembers`}
      label="Company members"
      labelIcon={<IconBuilding size={20} />}
      options={companyOptions}
      hidden={hideCompany}
    />
  );

  if (!showSpaceAccess) {
    return <div className="mt-6">{companySelect}</div>;
  }

  return (
    <div className="mt-6">
      <FieldGroup layout="horizontal" layoutOptions={{ dividers: true, ratio: "1:1" }}>
        {companySelect}
        <SelectBox
          field={`${fieldPrefix}.spaceMembers`}
          label="Space members"
          labelIcon={<IconTent size={20} />}
          options={spaceOptions}
        />
      </FieldGroup>
    </div>
  );
}

function shouldHideCompanySelector(options: SelectBoxOption[], noAccessValue: number) {
  const onlyOption = options.length === 1 ? options[0] : undefined;

  return onlyOption !== undefined && onlyOption.value === noAccessValue;
}
