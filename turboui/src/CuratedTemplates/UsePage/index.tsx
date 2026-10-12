import React from "react";
import { useTranslation } from "react-i18next";
import * as Forms from "../../Forms";
import { Page } from "../../Page";
import { Link } from "../../Link";
import { CompanyPickerPage } from "../../CompanyPickerPage";
import { SecondaryButton } from "../../Button";
import { ErrorCallout } from "../../Callouts";
import type { Company, CuratedTemplate, Space } from "../../ApiTypes";

export type TemplateSettings = {
  spaceId: string;
  championId: string | null;
  reviewerId: string | null;
  startDate: string;
};

export interface CuratedTemplateUsePageProps {
  template: Pick<CuratedTemplate, "title" | "summary" | "type">;
  spaces: Pick<Space, "id" | "name">[];
  defaultSpaceId: string;
  today: string;
  people: Forms.SelectPersonPerson[];
  peopleSpaceId: string | null;
  peopleError: boolean;
  peopleLoading: boolean;
  onRetryPeople: () => void;
  onSpaceChange: (id: string) => void;
  onCreate: (settings: TemplateSettings) => Promise<void>;
  onCancel: () => void;
  homePath: string;
}

export function CuratedTemplateUsePage(props: CuratedTemplateUsePageProps) {
  const { t } = useTranslation();
  const [error, setError] = React.useState(false);
  const isKpi = props.template.type === "kpi";
  const form = Forms.useForm<TemplateSettings>({
    fields: { spaceId: props.defaultSpaceId, championId: null, reviewerId: null, startDate: props.today },
    validate: (addError) => {
      if (!form.values.spaceId) addError("spaceId", t("Select a space"));
      if (form.values.championId && form.values.championId === form.values.reviewerId) {
        addError("reviewerId", t("Champion and reviewer must be different people"));
      }
    },
    submit: async () => {
      setError(false);
      await props.onCreate(form.values);
    },
    onError: () => setError(true),
    cancel: props.onCancel,
  });
  const { spaceId, championId, reviewerId } = form.values;
  React.useEffect(() => props.onSpaceChange(spaceId), [spaceId, props.onSpaceChange]);
  React.useEffect(() => {
    if (props.peopleSpaceId !== spaceId) return;
    for (const field of ["championId", "reviewerId"] as const) {
      const id = form.values[field];
      if (id && !props.people.some((person) => person.id === id)) form.actions.setValue(field, null);
    }
  }, [props.people, props.peopleSpaceId, spaceId, championId, reviewerId]);
  const peopleReady = props.peopleSpaceId === spaceId;
  const searchPeople = async (query: string) =>
    props.people.filter((person) => person.fullName.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  const createLabel = isKpi ? t("Create KPI") : props.template.type === "goal" ? t("Create Goal") : t("Create Project");

  return (
    <Page title={props.template.title} size="small" testId="curated-template-use-page">
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-2">{props.template.title}</h1>
        <p className="text-content-dimmed mb-8">{props.template.summary}</p>
        {props.spaces.length === 0 ? (
          <div data-test-id="no-writable-spaces">
            <p className="mb-4">
              {t("You need edit access to a space to use this template. Ask a company admin for access.")}
            </p>
            <Link to={props.homePath}>{t("Go to Home")}</Link>
          </div>
        ) : (
          <Forms.Form form={form}>
            <Forms.FieldGroup>
              <Forms.SelectBox
                field="spaceId"
                label={t("Space")}
                required
                options={props.spaces.map((space) => ({ value: space.id, label: space.name }))}
              />
              {peopleReady && (
                <Forms.SelectPerson
                  key={`champion-${spaceId}-${championId}`}
                  field="championId"
                  label={t("Champion")}
                  required={false}
                  allowEmpty
                  emptyLabel={t("Unassigned")}
                  searchFn={searchPeople}
                  default={props.people.find((p) => p.id === championId)}
                />
              )}
              {!isKpi && peopleReady && (
                <Forms.SelectPerson
                  key={`reviewer-${spaceId}-${reviewerId}`}
                  field="reviewerId"
                  label={t("Reviewer")}
                  required={false}
                  allowEmpty
                  emptyLabel={t("Unassigned")}
                  searchFn={searchPeople}
                  default={props.people.find((p) => p.id === reviewerId)}
                />
              )}
              {!isKpi && <Forms.DateInput field="startDate" label={t("Start date")} required />}
            </Forms.FieldGroup>
            {props.peopleError && (
              <div role="alert" className="mt-4" data-test-id="people-error">
                <ErrorCallout message={t("Unable to load people. Retry to continue creating this resource.")} />
                <SecondaryButton
                  size="xs"
                  className="mt-3"
                  onClick={props.onRetryPeople}
                  loading={props.peopleLoading}
                  disabled={props.peopleLoading}
                  testId="retry-people"
                >
                  {t("Retry")}
                </SecondaryButton>
              </div>
            )}
            <Forms.FormError
              when={error}
              message={t("Couldn't create this resource. Your settings are saved. Please try again.")}
              className="mt-4"
            />
            <Forms.Submit saveText={createLabel} disabled={!peopleReady} />
          </Forms.Form>
        )}
      </div>
    </Page>
  );
}

export function CuratedTemplateCompanyPicker(props: {
  title: string;
  companies: Pick<Company, "id" | "name">[];
  companyPath: (id: string) => string;
}) {
  return (
    <CompanyPickerPage
      companies={props.companies}
      companyPath={props.companyPath}
      description={<div className="text-content-dimmed mt-1">{props.title}</div>}
      testId="template-company-picker"
    />
  );
}
