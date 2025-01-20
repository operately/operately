import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as Projects from "@/models/projects";
import * as People from "@/models/people";
import * as Spaces from "@/models/spaces";

import { useLoadedData } from "./loader";
import { Paths, compareIds } from "@/routes/paths";
import { useMe } from "@/contexts/CurrentCompanyContext";
import { useNavigate } from "react-router-dom";

import Forms from "@/components/Forms";
import { SecondaryButton } from "@/components/Buttons";
import { AccessLevel } from "@/features/projects/AccessLevel";
import { PermissionLevels } from "@/features/Permissions";
import { AccessSelectors } from "@/features/projects/AccessSelectors";
import { applyAccessLevelConstraints, initialAccessLevels } from "@/features/projects/AccessFields";

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
  const { backPath, backPathName } = useLoadedData();
  if (!backPath) return null;

  return <Paper.NavigateBack to={backPath} title={backPathName} />;
}

function Form() {
  const me = useMe()!;
  const navigate = useNavigate();
  const [add] = Projects.useCreateProject();
  const { space, spaces, spaceOptions, goal, goals } = useLoadedData();

  const form = Forms.useForm({
    fields: {
      name: "",
      space: space?.id,
      champion: "",
      reviewer: "",
      goal: goal?.id,
      creatorRole: "",
      isContrib: "no",
      access: initialAccessLevels(null, findParentAccessLevel(space, spaces, space?.id)),
      showAdvancedAccess: false,
    },
    onChange: ({ field, newValues }) => {
      const parentAccessLevel = findParentAccessLevel(space, spaces, newValues.space);

      if (field === "space") {
        newValues.access = initialAccessLevels(null, parentAccessLevel);
      } else {
        newValues.access = applyAccessLevelConstraints(newValues.access, parentAccessLevel);
      }
    },
    validate: (addError) => {
      if (compareIds(form.values.champion, form.values.reviewer)) {
        addError("reviewer", "Can't be the same as the champion");
      }
    },
    submit: async () => {
      const res = await add({
        name: form.values.name,
        championId: form.values.champion,
        reviewerId: form.values.reviewer,
        creatorIsContributor: form.values.isContrib,
        creatorRole: form.values.creatorRole,
        spaceId: form.values.space,
        goalId: form.values.goal,
        anonymousAccessLevel: form.values.access.anonymous,
        companyAccessLevel: form.values.access.companyMembers,
        spaceAccessLevel: form.values.access.spaceMembers,
      });

      navigate(Paths.projectPath(res.project.id!));
    },
  });

  return (
    <Forms.Form form={form}>
      <Paper.Body minHeight="300px">
        <Forms.FieldGroup>
          <Forms.TextInput label="Project Name" field="name" placeholder="e.g. HR System Update" autoFocus />
          <Forms.SelectBox label="Space" field="space" options={spaceOptions} />
          <Forms.SelectGoal label="Goal" field="goal" goals={goals} required={false} />

          <Forms.FieldGroup layout="grid">
            <SelectChampion me={me} />
            <SelectReviewer me={me} />
          </Forms.FieldGroup>

          <CreatorsResponsibilityFields form={form} />
        </Forms.FieldGroup>

        <PrivacyLevel />
      </Paper.Body>

      <Forms.Submit saveText="Add Project" layout="centered" buttonSize="lg" />
    </Forms.Form>
  );
}

function SelectChampion({ me }: { me: People.Person }) {
  return <Forms.SelectPerson label="Champion" field="champion" default={me} />;
}

function SelectReviewer({ me }: { me: People.Person }) {
  return (
    <Forms.SelectPerson
      label="Reviewer"
      field="reviewer"
      allowEmpty={true}
      emptyLabel="No reviewer"
      default={me?.manager}
      required={false}
    />
  );
}

const WillYouContributeOptions = [
  { label: "No, I'm just setting it up for someone else", value: "no" },
  { label: "Yes, I'll contribute", value: "yes" },
];

function CreatorsResponsibilityFields({ form }) {
  const hideIsContrib = useShouldHideIsCotrib({ form });
  const hideCreatorRole = useShouldHideCreatorRole({ form });

  return (
    <>
      <Forms.RadioButtons
        label="Will you contribute?"
        field={"isContrib"}
        hidden={hideIsContrib}
        options={WillYouContributeOptions}
      />

      <Forms.TextInput
        label="What is your responsibility on this project?"
        field="creatorRole"
        placeholder="e.g. Responsible for managing the project and coordinating tasks"
        hidden={hideCreatorRole}
        required={false}
      />
    </>
  );
}

function PrivacyLevel() {
  const [isAdvanced] = Forms.useFieldValue<boolean>("showAdvancedAccess");

  return (
    <Paper.DimmedSection>
      <div className="flex items-center justify-between">
        <PrivacyLevelTitle field={"access"} />
        <PrivacyEdit />
      </div>

      {isAdvanced && <AccessSelectors />}
    </Paper.DimmedSection>
  );
}

function PrivacyLevelTitle({ field }: { field: string }) {
  const [anonymous] = Forms.useFieldValue<number>(`${field}.anonymous`);
  const [company] = Forms.useFieldValue<number>(`${field}.companyMembers`);
  const [space] = Forms.useFieldValue<number>(`${field}.spaceMembers`);

  return <AccessLevel anonymous={anonymous} company={company} space={space} tense="future" hideIcon={true} />;
}

function PrivacyEdit() {
  const [isAdvanced, setIsAdvanced] = Forms.useFieldValue<boolean>("showAdvancedAccess");
  if (isAdvanced) return null;

  return (
    <SecondaryButton size="xs" onClick={() => setIsAdvanced(true)} testId="edit-access-levels">
      Edit
    </SecondaryButton>
  );
}

function findParentAccessLevel(
  space: Spaces.Space | undefined,
  spaces: Spaces.Space[] | undefined,
  spaceId: string | null | undefined,
) {
  if (spaces && spaceId) {
    return spaces.find((s) => compareIds(s.id, spaceId))!.accessLevels!;
  } else if (space) {
    return space.accessLevels!;
  } else {
    return {
      public: PermissionLevels.NO_ACCESS,
      company: PermissionLevels.COMMENT_ACCESS,
      space: PermissionLevels.COMMENT_ACCESS,
    };
  }
}

function useShouldHideIsCotrib({ form }) {
  const me = useMe()!;

  return React.useMemo(() => {
    const isChampion = compareIds(form.values.champion, me.id);
    const isReviewer = compareIds(form.values.reviewer, me.id);

    return isChampion || isReviewer;
  }, [form.values.champion, form.values.reviewer, me?.id]);
}

function useShouldHideCreatorRole({ form }) {
  const me = useMe()!;

  return React.useMemo(() => {
    const isChampion = compareIds(form.values.champion, me.id!);
    const isReviewer = compareIds(form.values.reviewer, me.id!);
    const isContributor = form.values.isContrib === "yes";

    return isChampion || isReviewer || !isContributor;
  }, [form.values.champion, form.values.reviewer, form.values.isContrib, me.id]);
}
