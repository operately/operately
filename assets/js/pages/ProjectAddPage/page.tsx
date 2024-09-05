import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as Projects from "@/models/projects";

import Forms from "@/components/Forms";

import { useLoadedData } from "./loader";
import { useForm, FormState } from "./useForm";
import { DimmedLink } from "@/components/Link";
import { Paths, compareIds } from "@/routes/paths";
import { PermissionsProvider, usePermissionsContext } from "@/features/Permissions/PermissionsContext";
import { useMe } from "@/contexts/CurrentUserContext";
import { useNavigate } from "react-router-dom";

export function Page() {
  const { spaceID, company, space } = useLoadedData();
  const form = useForm();

  return (
    <PermissionsProvider company={company} space={space || form.fields.space}>
      {spaceID ? <NewProjectForSpacePage /> : <NewProjectPage />}
    </PermissionsProvider>
  );
}

function NewProjectForSpacePage({ form }: { form: FormState }) {
  const { space, spaceID } = useLoadedData();

  const spaceProjectsPath = Paths.spaceProjectsPath(spaceID!);

  return (
    <Pages.Page title="New Project">
      <Paper.Root size="small">
        <div className="flex items-center justify-center mb-4 gap-4">
          <DimmedLink to={spaceProjectsPath}>Back to {space!.name} Space</DimmedLink>
        </div>

        <h1 className="mb-4 font-bold text-3xl text-center">Start a new project in {space!.name}</h1>
        <Form />
      </Paper.Root>
    </Pages.Page>
  );
}

function NewProjectPage({ form }: { form: FormState }) {
  return (
    <Pages.Page title="New Project">
      <Paper.Root size="small">
        <div className="flex items-center justify-center mb-4 gap-4">
          <DimmedLink to={Paths.projectsPath()}>Back to Projects</DimmedLink>
        </div>

        <h1 className="mb-4 font-bold text-3xl text-center">Start a new project</h1>
        <Form />
      </Paper.Root>
    </Pages.Page>
  );
}

const WillYouContributeOptions = [
  { label: "No, I'm just setting it up for someone else", value: "no" },
  { label: "Yes, I'll contribute", value: "yes" },
];

// Creator Role
const CRLabel = "What is your responsibility on this project?";
const CRPlaceholder = "e.g. Responsible for managing the project and coordinating tasks";

function Form() {
  const me = useMe()!;
  const navigate = useNavigate();
  const [add] = Projects.useCreateProject();
  const { space, spaceOptions, goal, goals, allowSpaceSelection } = useLoadedData();

  const form = Forms.useForm({
    fields: {
      name: Forms.useTextField(),
      space: Forms.useSelectField(space?.id, spaceOptions),
      champion: Forms.useSelectPersonField(me),
      reviewer: Forms.useSelectPersonField(me.manager),
      goal: Forms.useTextField(goal?.id),
      creatorRole: Forms.useTextField(),
      isContrib: Forms.useSelectField("no", WillYouContributeOptions),
    },
    submit: async (form) => {
      const res = await add({
        name: form.fields.name.value,
        championId: form.fields.champion!.value!.id,
        reviewerId: form.fields.reviewer!.value!.id,
        creatorIsContributor: form.fields.isContrib!.value,
        creatorRole: form.fields.creatorRole.value,
        spaceId: form.fields.space!.value,
        goalId: form.fields.goal?.value,
        // anonymousAccessLevel: permissions.public,
        // companyAccessLevel: permissions.company,
        // spaceAccessLevel: permissions.space,
      });

      navigate(Paths.projectPath(res.project.id!));
    },
  });

  const hideIsContrib = useShouldHideIsCotrib({ form });
  const hideCreatorRole = useShouldHideCreatorRole({ form });

  return (
    <Forms.Form form={form}>
      <Paper.Body minHeight="300px">
        <Forms.FieldGroup>
          <Forms.TextInput label="Project Name" field={"name"} placeholder="e.g. HR System Update" />
          <Forms.SelectBox label="Space" field={"space"} hidden={!allowSpaceSelection} />
          <Forms.SelectGoal field={"goal"} goals={goals} label={"Goal"} />

          <Forms.FieldGroup layout="grid" gridColumns={2}>
            <Forms.SelectPerson label="Champion" field={"champion"} />
            <Forms.SelectPerson label="Reviewer" field={"reviewer"} />
          </Forms.FieldGroup>

          <Forms.RadioButtons label="Will you contribute?" field={"isContrib"} hidden={hideIsContrib} />
          <Forms.TextInput label={CRLabel} field={"creatorRole"} placeholder={CRPlaceholder} hidden={hideCreatorRole} />
        </Forms.FieldGroup>
      </Paper.Body>

      <Forms.Submit saveText="Add Project" layout="centered" />
    </Forms.Form>
  );
}

function useShouldHideIsCotrib({ form }) {
  const me = useMe()!;

  return React.useMemo(() => {
    const isChampion = compareIds(form.fields.champion?.value!.id!, me.id!);
    const isReviewer = compareIds(form.fields.reviewer?.value!.id!, me.id!);

    return isChampion || isReviewer;
  }, [form.fields.champion, form.fields.reviewer, me.id]);
}

function useShouldHideCreatorRole({ form }) {
  const me = useMe()!;

  return React.useMemo(() => {
    const isChampion = compareIds(form.fields.champion?.value!.id!, me.id!);
    const isReviewer = compareIds(form.fields.reviewer?.value!.id!, me.id!);
    const isContributor = form.fields.isContrib!.value === "yes";

    return isChampion || isReviewer || !isContributor;
  }, [form.fields.champion, form.fields.reviewer, form.fields.isContrib, me.id]);
}

// import { ResourcePermissionSelector } from "@/features/Permissions";
// <ResourcePermissionSelector />
