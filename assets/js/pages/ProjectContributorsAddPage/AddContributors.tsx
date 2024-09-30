import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Projects from "@/models/projects";
import * as Icons from "@tabler/icons-react";

import { PERMISSIONS_LIST, PermissionLevels } from "@/features/Permissions";
import { useAddProjectContributors } from "@/api";

import Forms from "@/components/Forms";
import { Paths } from "@/routes/paths";
import { useNavigateTo } from "@/routes/useNavigateTo";
import { LoaderResult } from "./loader";
import { SecondaryButton } from "@/components/Buttons";

interface ContributorFields {
  personId: string;
  responsibility: string;
  permissions: PermissionLevels;
  role: string;
}

export function AddContributors() {
  const { project } = Pages.useLoadedData() as LoaderResult;
  const gotoContribPage = useNavigateTo(Paths.projectContributorsPath(project.id!));
  const personSearchFn = Projects.useContributorSearchFn(project!);
  const [add] = useAddProjectContributors();

  const form = Forms.useForm({
    fields: {
      contributors: [
        {
          personId: "",
          responsibility: "",
          permissions: PermissionLevels.EDIT_ACCESS,
          role: "contributor",
        },
      ],
    },
    submit: async () => {
      await add({
        projectId: project.id,
        // contributors: form.values.contributors,
      });

      gotoContribPage();
    },
  });

  return (
    <Paper.Root size="small">
      <Paper.NavigateBack to={Paths.projectContributorsPath(project.id!)} title="Back to Team & Access" />
      <div className="text-2xl font-extrabold mb-4 text-center">Add contributors to {project.name}</div>

      <Forms.Form form={form}>
        <Contributors form={form} personSearchFn={personSearchFn} />
        <AddMoreContributorsButton />

        <Forms.Submit saveText="Add contributors" layout="centered" buttonSize="base" />
      </Forms.Form>
    </Paper.Root>
  );
}

function Contributors({ form, personSearchFn }) {
  return (
    <div className="flex flex-col gap-6">
      {form.values.contributors.map((_, i: number) => (
        <Contributor key={i} field={`contributors[${i}]`} personSearchFn={personSearchFn} />
      ))}
    </div>
  );
}

function Contributor({ field, personSearchFn }) {
  return (
    <Paper.Body>
      <Forms.FieldGroup layout="horizontal">
        <Forms.SelectPerson field={field + ".personId"} label="Contributor" searchFn={personSearchFn} />
        <Forms.SelectBox field={field + ".permissions"} label="Access Level" options={PERMISSIONS_LIST} />

        <Forms.TextInput
          field={field + ".responsibility"}
          placeholder="e.g. Project Manager"
          label="Responsibility"
          required={true}
        />
      </Forms.FieldGroup>
    </Paper.Body>
  );
}

function AddMoreContributorsButton() {
  const [value, setValue] = Forms.useFieldValue<ContributorFields[]>("contributors");

  const addMore = React.useCallback(() => {
    const newContributor = {
      personId: "",
      responsibility: "",
      permissions: PermissionLevels.EDIT_ACCESS,
      role: "contributor",
    };

    setValue([...value, newContributor]);
  }, [value, setValue]);

  return (
    <div className="flex justify-center" style={{ marginTop: "-18px" }}>
      <SecondaryButton onClick={addMore}>
        <Icons.IconPlus size={16} />
      </SecondaryButton>
    </div>
  );
}
