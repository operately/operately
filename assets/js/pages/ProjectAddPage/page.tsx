import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as Projects from "@/models/projects";

import { useLoadedData } from "./loader";
import { DimmedLink } from "@/components/Link";
import { Paths, compareIds } from "@/routes/paths";
import { useMe } from "@/contexts/CurrentUserContext";
import { useNavigate } from "react-router-dom";

import Forms from "@/components/Forms";
import { usePermissionsState } from "@/features/Permissions/usePermissionsState";
import { ResourcePermissionSelector } from "@/features/Permissions";

export function Page() {
  return (
    <Pages.Page title="New Project">
      <Paper.Root size="small">
        <Navigation />
        <PageTitle />
        <Form />
      </Paper.Root>
    </Pages.Page>
  );
}

function PageTitle() {
  const { spaceID, space } = useLoadedData();

  if (spaceID && space) {
    return <h1 className="mb-4 font-bold text-3xl text-center">Start a new project in {space!.name}</h1>;
  } else {
    return <h1 className="mb-4 font-bold text-3xl text-center">Start a new project</h1>;
  }
}

function Navigation() {
  const { spaceID, space } = useLoadedData();

  if (spaceID && space) {
    const spaceProjectsPath = Paths.spaceProjectsPath(spaceID!);

    return (
      <div className="flex items-center justify-center mb-4 gap-4">
        <DimmedLink to={spaceProjectsPath}>Back to {space!.name} Space</DimmedLink>
      </div>
    );
  } else {
    return (
      <div className="flex items-center justify-center mb-4 gap-4">
        <DimmedLink to={Paths.projectsPath()}>Back to Projects</DimmedLink>
      </div>
    );
  }
}

const WillYouContributeOptions = [
  { label: "No, I'm just setting it up for someone else", value: "no" },
  { label: "Yes, I'll contribute", value: "yes" },
];

const CRLabel = "What is your responsibility on this project?";
const CRPlaceholder = "e.g. Responsible for managing the project and coordinating tasks";

function Form() {
  const me = useMe()!;
  const navigate = useNavigate();
  const [add] = Projects.useCreateProject();
  const { space, spaceOptions, goal, goals, allowSpaceSelection, company } = useLoadedData();

  const permissions = usePermissionsState({ company: company, space: space });

  const form = Forms.useForm({
    fields: {
      name: Forms.useTextField(),
      space: Forms.useSelectField(space?.id, spaceOptions),
      champion: Forms.useSelectPersonField(me),
      reviewer: Forms.useSelectPersonField(me.manager),
      goal: Forms.useTextField(goal?.id, { optional: true }),
      creatorRole: Forms.useTextField(null, { optional: true }),
      isContrib: Forms.useSelectField("no", WillYouContributeOptions),
    },
    validate: (fields, addError) => {
      if (compareIds(fields.champion.value?.id, fields.reviewer.value?.id)) {
        addError("reviewer", "Can't be the same as the champion");
      }
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
        anonymousAccessLevel: permissions.permissions.public,
        companyAccessLevel: permissions.permissions.company,
        spaceAccessLevel: permissions.permissions.space,
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

          <ResourcePermissionSelector state={permissions} />
        </Forms.FieldGroup>
      </Paper.Body>

      <Forms.Submit saveText="Add Project" layout="centered" />
    </Forms.Form>
  );
}

function useShouldHideIsCotrib({ form }) {
  const me = useMe()!;

  return React.useMemo(() => {
    const isChampion = compareIds(form.fields.champion?.value?.id, me.id);
    const isReviewer = compareIds(form.fields.reviewer?.value?.id, me.id);

    return isChampion || isReviewer;
  }, [form.fields.champion, form.fields.reviewer, me?.id]);
}

function useShouldHideCreatorRole({ form }) {
  const me = useMe()!;

  return React.useMemo(() => {
    const isChampion = compareIds(form.fields.champion?.value?.id!, me.id!);
    const isReviewer = compareIds(form.fields.reviewer?.value?.id!, me.id!);
    const isContributor = form.fields.isContrib!.value === "yes";

    return isChampion || isReviewer || !isContributor;
  }, [form.fields.champion, form.fields.reviewer, form.fields.isContrib, me.id]);
}
