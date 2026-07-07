import * as React from "react";
import { Forms, IconBuilding, IconTent } from "turboui";

import { PermissionLevels } from "../Permissions";
import { Option } from "../Permissions/AccessFields";

export function AccessSelectors() {
  const [companyMembersOptions] = Forms.useFieldValue<Option[]>("access.companyMembersOptions");
  const [spaceMembersOptions] = Forms.useFieldValue<Option[]>("access.spaceMembersOptions");
  const companyOptions = companyMembersOptions ?? [];
  const spaceOptions = spaceMembersOptions ?? [];

  return (
    <div className="mt-6">
      <Forms.FieldGroup layout="horizontal" layoutOptions={{ dividers: true, ratio: "1:1" }}>
        <Forms.SelectBox
          field={"access.companyMembers"}
          label="Company members"
          labelIcon={<IconBuilding size={20} />}
          options={companyOptions as unknown as { label: string; value: string }[]}
          hidden={shouldHide(companyOptions)}
        />
        <Forms.SelectBox
          field={"access.spaceMembers"}
          label="Space members"
          labelIcon={<IconTent size={20} />}
          options={spaceOptions as unknown as { label: string; value: string }[]}
        />
      </Forms.FieldGroup>
    </div>
  );
}

function shouldHide(options: Option[]) {
  return options.length === 1 && options[0]!.value === PermissionLevels.NO_ACCESS;
}
