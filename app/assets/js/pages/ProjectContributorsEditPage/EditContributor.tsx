import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as People from "@/models/people";
import * as Permissions from "@/models/permissions";
import * as ProjectContributors from "@/models/projectContributors";

import Forms from "@/components/Forms";
import { FieldObject } from "@/components/Forms";
import { PageTitle } from "./PageTitle";
import { useGotoProjectContributors, useLoadedData } from "./loader";
import { accessLevelAsEnumValue, PermissionLevels } from "@/features/Permissions";

export function EditContributor() {
  const { contributor } = useLoadedData();

  const form = useForm(contributor);
  const name = People.firstName(contributor.person!);
  const pageTitle = `Edit ${name}'s responsibilities and access level`;
  const placeholder = "e.g. Design the UI/UX for the project";
  const label = `What is ${name}'s responsibility on this project?`;

  const permissionsList = React.useMemo(() => {
    if (contributor.permissions?.hasFullAccess) {
      return Permissions.PERMISSIONS_LIST_COMPLETE;
    }
    if (contributor.permissions?.canEdit) {
      return Permissions.PERMISSIONS_LIST;
    }
    return [];
  }, [contributor.permissions?.hasFullAccess, contributor.permissions?.canEdit]);

  return (
    <Paper.Body>
      <Forms.Form form={form}>
        <PageTitle title={pageTitle} />

        <Forms.FieldGroup>
          <Forms.TextInput field={"responsibility"} placeholder={placeholder} label={label} />
          <Forms.SelectBox field={"permissions"} label="Access Level" options={permissionsList} />
        </Forms.FieldGroup>

        <Forms.Submit saveText="Save" />
      </Forms.Form>
    </Paper.Body>
  );
}

interface FormContributor extends FieldObject {
  responsibility: string;
  permissions: Permissions.AccessOptions | null;
}

function useForm(contributor: ProjectContributors.ProjectContributor) {
  const [update] = ProjectContributors.useUpdateContributor();
  const gotoProjectContrib = useGotoProjectContributors();

  const form = Forms.useForm<FormContributor>({
    fields: {
      responsibility: contributor.responsibility || "",
      permissions: accessLevelAsEnumValue(contributor.accessLevel || PermissionLevels.NO_ACCESS),
    },
    validate: async (addError) => {
      if (!form.values.permissions) {
        addError("permissions", "Please select an access level");
      }
    },
    submit: async () => {
      await update({
        contribId: contributor.id,
        responsibility: form.values.responsibility?.trim() ?? "",
        permissions: form.values.permissions,
      });

      gotoProjectContrib();
    },
    cancel: gotoProjectContrib,
  });

  return form;
}
