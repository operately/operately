import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as Icons from "@tabler/icons-react";
import * as Projects from "@/models/projects";

import { useLoadedData } from "./loader";
import { DimmedLink } from "@/components/Link";
import { Paths, compareIds } from "@/routes/paths";
import { useMe } from "@/contexts/CurrentUserContext";
import { useNavigate } from "react-router-dom";

import Forms from "@/components/Forms";
import {
  COMMENT_ACCESS,
  EDIT_ACCESS,
  FULL_ACCESS,
  NO_ACCESS,
  PermissionLevels,
  VIEW_ACCESS,
} from "@/features/Permissions";
import { SecondaryButton } from "@/components/Buttons";
import { AccessLevel } from "@/features/projects/AccessLevel";

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
  const { space, spaceOptions, goal, goals, allowSpaceSelection } = useLoadedData();

  const form = Forms.useForm({
    fields: {
      name: Forms.useTextField(),
      space: Forms.useSelectField(space?.id, spaceOptions),
      champion: Forms.useSelectPersonField(me),
      reviewer: Forms.useSelectPersonField(me.manager, { optional: true }),
      goal: Forms.useTextField(goal?.id, { optional: true }),
      creatorRole: Forms.useTextField(null, { optional: true }),
      isContrib: Forms.useSelectField("no", WillYouContributeOptions),
      access: useAccessFields(),
    },
    validate: (addError) => {
      if (compareIds(form.fields.champion.value?.id, form.fields.reviewer.value?.id)) {
        addError("reviewer", "Can't be the same as the champion");
      }
    },
    submit: async () => {
      const res = await add({
        name: form.fields.name.value,
        championId: form.fields.champion!.value!.id,
        reviewerId: form.fields.reviewer!.value?.id,
        creatorIsContributor: form.fields.isContrib!.value,
        creatorRole: form.fields.creatorRole.value,
        spaceId: form.fields.space!.value,
        goalId: form.fields.goal?.value,
        anonymousAccessLevel: form.fields.access.fields.annonymousMembers!.value!,
        companyAccessLevel: form.fields.access.fields.companyMembers!.value!,
        spaceAccessLevel: form.fields.access.fields.spaceMembers!.value!,
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

          <Forms.FieldGroup layout="grid">
            <Forms.SelectPerson label="Champion" field={"champion"} />
            <Forms.SelectPerson label="Reviewer" field={"reviewer"} allowEmpty={true} emptyLabel="No reviewer" />
          </Forms.FieldGroup>

          <Forms.RadioButtons label="Will you contribute?" field={"isContrib"} hidden={hideIsContrib} />
          <Forms.TextInput label={CRLabel} field={"creatorRole"} placeholder={CRPlaceholder} hidden={hideCreatorRole} />

          <AccessSelector field={"access"} />
        </Forms.FieldGroup>
      </Paper.Body>

      <Forms.Submit saveText="Add Project" layout="centered" buttonSize="lg" />
    </Forms.Form>
  );
}

type AccessFields = ReturnType<typeof useAccessFields>;

function useAccessFields() {
  const annonymousOptions = [NO_ACCESS, VIEW_ACCESS];
  const companyOptions = [FULL_ACCESS, EDIT_ACCESS, COMMENT_ACCESS, VIEW_ACCESS, NO_ACCESS];
  const spaceOptions = [FULL_ACCESS, EDIT_ACCESS, COMMENT_ACCESS, VIEW_ACCESS, NO_ACCESS];

  const access = Forms.useFieldSet({
    fields: {
      isAdvanced: Forms.useBooleanField(false),
      annonymousMembers: Forms.useSelectNumberField(PermissionLevels.NO_ACCESS, annonymousOptions),
      companyMembers: Forms.useSelectNumberField(PermissionLevels.COMMENT_ACCESS, companyOptions),
      spaceMembers: Forms.useSelectNumberField(PermissionLevels.COMMENT_ACCESS, spaceOptions),
    },
  });

  React.useEffect(() => {
    const value = access.fields.annonymousMembers.value!;

    access.fields.companyMembers.setOptions(companyOptions.filter((option) => option.value >= value));
    access.fields.companyMembers.setValue((current) => Math.max(value!, current!));
  }, [access.fields.annonymousMembers.value]);

  React.useEffect(() => {
    const value = access.fields.companyMembers.value!;

    access.fields.spaceMembers.setOptions(spaceOptions.filter((option) => option.value >= value));
    access.fields.spaceMembers.setValue((current) => Math.max(value!, current!));
  }, [access.fields.companyMembers.value]);

  return access;
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

function AccessSelector({ field }: { field: string }) {
  return (
    <Paper.DimmedSection>
      <div className="flex items-center justify-between">
        <AccessSelectorTitle field={field} />
        <AccessSelectorEditButton field={field} />
      </div>

      <AccessSelectorAdvancedOptions field={field} />
    </Paper.DimmedSection>
  );
}

function AccessSelectorTitle({ field }: { field: string }) {
  const access = Forms.useField<AccessFields>(field);

  return (
    <AccessLevel
      annonymous={access.fields.annonymousMembers.value!}
      company={access.fields.companyMembers.value!}
      space={access.fields.spaceMembers.value!}
      tense="future"
      hideIcon={true}
    />
  );
}

function AccessSelectorEditButton({ field }: { field: string }) {
  const access = Forms.useField<AccessFields>(field);

  if (access.fields.isAdvanced.value) return null;

  return (
    <SecondaryButton size="xs" onClick={access.fields.isAdvanced.toggle}>
      Edit
    </SecondaryButton>
  );
}

function AccessSelectorAdvancedOptions({ field }: { field: string }) {
  const access = Forms.useField<AccessFields>(field);

  if (!access.fields.isAdvanced.value) return null;

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between border-t last:border-b border-stroke-subtle py-2.5">
        <div className="flex items-center gap-2 flex-1 w-2/3 font-semibold">
          <Icons.IconWorld size={20} />
          <span>People on the internet</span>
        </div>

        <div className="w-1/3">
          <Forms.SelectBox field={"access.annonymousMembers"} />
        </div>
      </div>

      <div className="flex items-center justify-between border-t last:border-b border-stroke-subtle py-2.5">
        <div className="flex items-center gap-2 flex-1 w-2/3 font-semibold">
          <Icons.IconBuilding size={20} />
          <span>Company members</span>
        </div>

        <div className="w-1/3">
          <Forms.SelectBox field={"access.companyMembers"} />
        </div>
      </div>

      <div className="flex items-center justify-between border-t last:border-b border-stroke-subtle py-2.5">
        <div className="flex items-center gap-2 flex-1 w-2/3 font-semibold">
          <Icons.IconTent size={20} className="text-content-accent" strokeWidth={2} />
          <span>Space members</span>
        </div>

        <div className="w-1/3">
          <Forms.SelectBox field={"access.spaceMembers"} />
        </div>
      </div>
    </div>
  );
}
