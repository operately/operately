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
import { SecondaryButton } from "@/components/Buttons";
import { AccessLevel } from "@/features/projects/AccessLevel";
import { useProjectAccessFields } from "@/features/Permissions/useAccessLevelsField";
import { DEFAULT_ANNONYMOUS_OPTIONS, DEFAULT_COMPANY_OPTIONS, DEFAULT_SPACE_OPTIONS } from "@/features/Permissions";

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

function Form() {
  const me = useMe()!;
  const navigate = useNavigate();
  const [add] = Projects.useCreateProject();
  const { space, spaceOptions, goal, goals, allowSpaceSelection } = useLoadedData();

  const form = Forms.useForm({
    fields: {
      name: "",
      space: space?.id,
      champion: "",
      reviewer: "",
      goal: goal?.id,
      creatorRole: "",
      isContrib: "no",
      access: useProjectAccessFields(),
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
        anonymousAccessLevel: form.values.access.annonymousMembers,
        companyAccessLevel: form.values.access.companyMembers,
        spaceAccessLevel: form.values.access.spaceMembers,
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
          <Forms.TextInput label="Project Name" field="name" placeholder="e.g. HR System Update" />
          <Forms.SelectBox label="Space" field="space" hidden={!allowSpaceSelection} options={spaceOptions} />
          <Forms.SelectGoal field="goal" goals={goals} label="Goal" required={false} />

          <Forms.FieldGroup layout="grid">
            <Forms.SelectPerson label="Champion" field="champion" default={me} />
            <Forms.SelectPerson
              label="Reviewer"
              field="reviewer"
              allowEmpty={true}
              emptyLabel="No reviewer"
              default={me?.manager}
              required={false}
            />
          </Forms.FieldGroup>

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
        </Forms.FieldGroup>

        <AccessSelectorFields />
      </Paper.Body>

      <Forms.Submit saveText="Add Project" layout="centered" buttonSize="lg" />
    </Forms.Form>
  );
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

function AccessSelectorFields() {
  const [isAdvanced, setIsAdvanced] = Forms.useFieldValue("access.isAdvanced");
  const [annonymousMembers] = Forms.useFieldValue("access.annonymousMembers");
  const [companyMembers, setCompanyMembers] = Forms.useFieldValue("access.companyMembers");
  const [spaceMembers, setSpaceMembers] = Forms.useFieldValue("access.spaceMembers");

  const [annonymousAccessOptions] = React.useState(DEFAULT_ANNONYMOUS_OPTIONS);
  const [companyAccessOptions, setCompanyAccessOptions] = React.useState(DEFAULT_COMPANY_OPTIONS);
  const [spaceAccessOptions, setSpaceAccessOptions] = React.useState(DEFAULT_SPACE_OPTIONS);

  React.useEffect(() => {
    if (companyMembers < annonymousMembers) {
      setCompanyMembers(annonymousMembers);
    }

    const options = DEFAULT_COMPANY_OPTIONS.filter((option) => option.value >= annonymousMembers);
    setCompanyAccessOptions(options);
  }, [annonymousMembers]);

  React.useEffect(() => {
    if (spaceMembers < companyMembers) {
      setSpaceMembers(companyMembers);
    }

    const options = DEFAULT_SPACE_OPTIONS.filter((option) => option.value >= companyMembers);
    setSpaceAccessOptions(options);
  }, [companyMembers]);

  return (
    <Paper.DimmedSection>
      <div className="flex items-center justify-between">
        <AccessSelectorTitle field={"access"} />
        <AccessSelectorEditButton isAdvanced={isAdvanced} setIsAdvanced={setIsAdvanced} />
      </div>

      {isAdvanced && (
        <div className="mt-6">
          <Forms.FieldGroup layout="horizontal" layoutOptions={{ dividers: true, ratio: "1:1" }}>
            <Forms.SelectBox
              field={"access.annonymousMembers"}
              label="People on the internet"
              labelIcon={<Icons.IconWorld size={20} />}
              options={annonymousAccessOptions}
            />
            <Forms.SelectBox
              field={"access.companyMembers"}
              label="Company members"
              labelIcon={<Icons.IconBuilding size={20} />}
              options={companyAccessOptions}
            />
            <Forms.SelectBox
              field={"access.spaceMembers"}
              label="Space members"
              labelIcon={<Icons.IconTent size={20} />}
              options={spaceAccessOptions}
            />
          </Forms.FieldGroup>
        </div>
      )}
    </Paper.DimmedSection>
  );
}

function AccessSelectorTitle({ field }: { field: string }) {
  const [annonymous] = Forms.useFieldValue(`${field}.annonymousMembers`);
  const [company] = Forms.useFieldValue(`${field}.companyMembers`);
  const [space] = Forms.useFieldValue(`${field}.spaceMembers`);

  return <AccessLevel annonymous={annonymous} company={company} space={space} tense="future" hideIcon={true} />;
}

function AccessSelectorEditButton({
  isAdvanced,
  setIsAdvanced,
}: {
  isAdvanced: boolean;
  setIsAdvanced: (value: boolean) => void;
}) {
  if (isAdvanced) return null;

  return (
    <SecondaryButton size="xs" onClick={() => setIsAdvanced(true)}>
      Edit
    </SecondaryButton>
  );
}
