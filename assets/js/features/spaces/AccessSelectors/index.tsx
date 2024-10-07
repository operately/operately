import * as React from "react";
import * as Icons from "@tabler/icons-react";

import { PermissionLevels } from "@/features/Permissions";

import Forms from "@/components/Forms";

type Option = { value: PermissionLevels; label: string };

export function AccessSelectors() {
  const [anonymousOptions] = Forms.useFieldValue<Option[]>("access.anonymousOptions");
  const [companyMembersOptions] = Forms.useFieldValue<Option[]>("access.companyMembersOptions");

  return (
    <div className="mt-6">
      <Forms.FieldGroup layout="horizontal" layoutOptions={{ dividers: true, ratio: "1:1" }}>
        <Forms.SelectBox
          field={"access.anonymous"}
          label="People on the internet"
          labelIcon={<Icons.IconWorld size={20} />}
          options={anonymousOptions}
          hidden={shouldHide(anonymousOptions)}
        />
        <Forms.SelectBox
          field={"access.companyMembers"}
          label="Company members"
          labelIcon={<Icons.IconBuilding size={20} />}
          options={companyMembersOptions}
          hidden={shouldHide(companyMembersOptions)}
        />
      </Forms.FieldGroup>
    </div>
  );
}

function shouldHide(options: Option[]) {
  return options.length === 1 && options[0]!.value === PermissionLevels.NO_ACCESS;
}
