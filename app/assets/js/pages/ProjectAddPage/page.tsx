import { Trans } from "turboui";
import i18n from "@/i18n";
import { useTranslation } from "react-i18next";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as People from "@/models/people";
import * as Projects from "@/models/projects";
import * as Spaces from "@/models/spaces";
import * as React from "react";

import { useMe } from "@/contexts/CurrentCompanyContext";
import { compareIds } from "@/routes/paths";
import { useNavigate, useSearchParams } from "react-router";
import { useLoadedData } from "./loader";

import { PermissionLevels } from "@/features/Permissions";
import { applyAccessLevelConstraints, initialAccessLevels } from "@/features/Permissions/AccessFields";
import { AccessSelectors } from "@/features/projects/AccessSelectors";
import { AccessLevelSummary, Forms, ProjectTemplateSelection, SecondaryButton } from "turboui";

import { usePaths } from "@/routes/paths";
export function Page() {
  const { t } = useTranslation();
  return (
    <Pages.Page title={t("New Project")}>
      <Paper.Root size="small">
        <Navigation />
        <PageTitle />
        <Form />
      </Paper.Root>
    </Pages.Page>
  );
}

function PageTitle() {
  const { t } = useTranslation();
  const { space, spaces } = useLoadedData();
  const eligibleSpace = findEligibleSpace(spaces, space?.id);

  if (eligibleSpace) {
    return (
      <h1 className="mb-4 font-bold text-3xl text-center">
        <Trans i18nKey="Start a new project in {{name}}" values={{ name: eligibleSpace.name }} />
      </h1>
    );
  } else {
    return <h1 className="mb-4 font-bold text-3xl text-center">{t("Start a new project")}</h1>;
  }
}

function Navigation() {
  const { backPath, backPathName } = useLoadedData();
  if (!backPath) return null;

  return <Paper.NavigateBack to={backPath} title={backPathName} />;
}

function Form() {
  const { t } = useTranslation();
  const paths = usePaths();
  const me = useMe()!;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const add = Projects.useCreateProject();
  const createFromTemplate = Projects.useCreateProjectFromTemplate();
  const { space, spaces, spaceOptions, goal, goals, templates } = useLoadedData();
  const search = People.usePeopleSearch(People.CompanyWideSearchScope);
  const initialSpace = findEligibleSpace(spaces, space?.id);
  const initialParentAccess = findParentAccessLevel(spaces, initialSpace?.id);
  const initialTemplateID = templates.find(
    (template) => template.id === searchParams.get("templateId") && compareIds(template.space.id, initialSpace?.id),
  )?.id;

  const form = Forms.useForm({
    fields: {
      name: "",
      space: initialSpace?.id,
      template: initialTemplateID ?? "",
      startDate: "",
      champion: "",
      reviewer: "",
      goal: goal,
      access: initialParentAccess ? initialAccessLevels(null, initialParentAccess) : undefined,
      showAdvancedAccess: false,
    },
    onChange: ({ field, newValues }) => {
      const parentAccessLevel = findParentAccessLevel(spaces, newValues.space);

      if (field === "space") {
        newValues.access = parentAccessLevel ? initialAccessLevels(null, parentAccessLevel) : undefined;
        newValues.template = "";
        newValues.startDate = "";
      } else if (parentAccessLevel && newValues.access) {
        newValues.access = applyAccessLevelConstraints(newValues.access, parentAccessLevel);
      }
    },
    validate: (addError) => {
      if (!form.values.template && compareIds(form.values.champion, form.values.reviewer)) {
        addError("reviewer", i18n.t("Can't be the same as the champion"));
      }
      const selectedSpace = findEligibleSpace(spaces, form.values.space);
      if (!selectedSpace) {
        addError("space", i18n.t("Space is required"));
      } else if (!getAccessLevels(selectedSpace) || !form.values.access) {
        addError("form", i18n.t("The project could not be created. Check the form and try again."));
      }
    },
    submit: async () => {
      const selectedSpace = findEligibleSpace(spaces, form.values.space);
      if (!selectedSpace) {
        form.actions.addErrors({ space: i18n.t("Space is required") });
        return false;
      }

      const access = form.values.access;
      if (!getAccessLevels(selectedSpace) || !access) {
        form.actions.addErrors({ form: i18n.t("The project could not be created. Check the form and try again.") });
        return false;
      }

      const projectInput = {
        name: form.values.name,
        championId: form.values.champion,
        reviewerId: form.values.reviewer,
        spaceId: selectedSpace.id,
        goalId: form.values.goal?.id,
        anonymousAccessLevel: access.anonymous,
        companyAccessLevel: access.companyMembers,
        spaceAccessLevel: access.spaceMembers,
      };
      const res = form.values.template
        ? await createFromTemplate.mutateAsync({
            name: projectInput.name,
            spaceId: projectInput.spaceId,
            goalId: projectInput.goalId,
            anonymousAccessLevel: projectInput.anonymousAccessLevel,
            companyAccessLevel: projectInput.companyAccessLevel,
            spaceAccessLevel: projectInput.spaceAccessLevel,
            templateId: form.values.template,
            startDate: form.values.startDate,
          })
        : await add.mutateAsync(projectInput);

      navigate(paths.projectPath(res.project.id!));
      return true;
    },
    onError: () => {
      form.actions.addErrors({
        form: i18n.t("The project could not be created. Check the form and try again."),
      });
    },
  });
  const selectedSpaceId = findEligibleSpace(spaces, form.values.space)?.id;

  return (
    <Forms.Form form={form}>
      <Paper.Body minHeight="300px" fullHeightOnMobile={false}>
        <Forms.FieldGroup>
          <Forms.TextInput
            label={t("Project Name")}
            field="name"
            placeholder={t("e.g. HR System Update")}
            autoFocus
            required
          />
          <Forms.SelectBox label={t("Space")} field="space" options={spaceOptions} required />
          <ProjectTemplateSelection
            spaceId={selectedSpaceId}
            onCreateTemplate={
              selectedSpaceId ? () => navigate(paths.newProjectTemplatePath(selectedSpaceId)) : undefined
            }
            templates={templates.map((template) => ({
              id: template.id,
              name: template.name,
              spaceId: template.space.id,
              inactivePeopleSummary: template.inactivePeopleSummary,
              inactiveDiscussionCount: template.inactiveDiscussionCount,
            }))}
          />
          <Forms.SelectGoal label={t("Goal")} field="goal" goals={goals} required={false} />

          {!form.values.template && (
            <Forms.FieldGroup
              layout="grid"
              layoutOptions={{ columns: 2, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 16rem), 1fr))" }}
            >
              <SelectChampion me={me} search={search} />
              <SelectReviewer me={me} search={search} />
            </Forms.FieldGroup>
          )}
        </Forms.FieldGroup>

        <PrivacyLevel />
        <Forms.FormError message={form.errors.form} />
      </Paper.Body>

      <Forms.Submit saveText={t("Add Project")} layout="centered" buttonSize="lg" />
    </Forms.Form>
  );
}

function SelectChampion({ me, search }: { me: People.Person; search: (query: string) => Promise<People.Person[]> }) {
  const { t } = useTranslation();
  return <Forms.SelectPerson label={t("Champion")} field="champion" searchFn={search} default={me} />;
}

function SelectReviewer({ me, search }: { me: People.Person; search: (query: string) => Promise<People.Person[]> }) {
  const { t } = useTranslation();
  return (
    <Forms.SelectPerson
      label={t("Reviewer")}
      field="reviewer"
      searchFn={search}
      allowEmpty={true}
      emptyLabel={t("No reviewer")}
      default={me?.manager}
      required={false}
    />
  );
}

function PrivacyLevel() {
  useTranslation();
  const [isAdvanced] = Forms.useFieldValue<boolean>("showAdvancedAccess");
  const [access] = Forms.useFieldValue("access");

  return (
    <Paper.DimmedSection testId="project-access-section">
      <div className="flex items-center justify-between">
        <PrivacyLevelTitle field={"access"} />
        <PrivacyEdit hasAccess={Boolean(access)} />
      </div>

      {isAdvanced && Boolean(access) && <AccessSelectors />}
    </Paper.DimmedSection>
  );
}

function PrivacyLevelTitle({ field }: { field: string }) {
  const [anonymous = PermissionLevels.NO_ACCESS] = Forms.useFieldValue<number>(`${field}.anonymous`);
  const [company = PermissionLevels.NO_ACCESS] = Forms.useFieldValue<number>(`${field}.companyMembers`);
  const [space = PermissionLevels.NO_ACCESS] = Forms.useFieldValue<number>(`${field}.spaceMembers`);

  return (
    <AccessLevelSummary
      resourceType="project"
      tense="future"
      anonymous={anonymous}
      company={company}
      space={space}
      hideIcon
    />
  );
}

function PrivacyEdit({ hasAccess }: { hasAccess: boolean }) {
  const { t } = useTranslation();
  const [isAdvanced, setIsAdvanced] = Forms.useFieldValue<boolean>("showAdvancedAccess");
  if (isAdvanced || !hasAccess) return null;

  return (
    <SecondaryButton size="xs" onClick={() => setIsAdvanced(true)} testId="edit-access-levels">
      {t("Edit")}
    </SecondaryButton>
  );
}

function findEligibleSpace(spaces: Spaces.Space[], spaceId: string | null | undefined) {
  return spaces.find((space) => compareIds(space.id, spaceId));
}

function getAccessLevels(space: Spaces.Space | undefined) {
  const access = space?.accessLevels;
  if (access?.public == null || access.company == null || access.space == null) return undefined;
  return access;
}

function findParentAccessLevel(spaces: Spaces.Space[], spaceId: string | null | undefined) {
  if (spaceId) return getAccessLevels(findEligibleSpace(spaces, spaceId));

  return {
    __typename: "access_levels" as const,
    public: PermissionLevels.NO_ACCESS,
    company: PermissionLevels.COMMENT_ACCESS,
    space: PermissionLevels.COMMENT_ACCESS,
  };
}
