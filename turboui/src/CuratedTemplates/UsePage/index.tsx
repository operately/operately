import React from "react";
import { useTranslation } from "react-i18next";
import * as Forms from "../../Forms";
import { Page } from "../../Page";
import { Link } from "../../Link";
import { CompanyPickerPage } from "../../CompanyPickerPage";
import { SecondaryButton } from "../../Button";
import { ErrorCallout } from "../../Callouts";
import { IconChartColumn, IconGoalPlain, IconProjectPlain } from "../../icons";
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
  const heading = { project: t("Create your project"), goal: t("Create your goal"), kpi: t("Create your KPI") };

  return (
    <Page title={props.template.title} size="small" testId="curated-template-use-page">
      <div className="px-5 py-6 sm:p-8">
        <h1 className="text-2xl font-bold text-content-accent">{heading[props.template.type]}</h1>
        <p className="mt-2 text-content-subtle">{t("Start with this template and customize it for your team.")}</p>
        <TemplateCard template={props.template} />
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
              <div className={`grid gap-4 ${isKpi ? "" : "sm:grid-cols-2"}`}>
                <div>
                  <Forms.SelectBox
                    field="spaceId"
                    label={t("Space")}
                    required
                    options={props.spaces.map((space) => ({ value: space.id, label: space.name }))}
                  />
                </div>
                {!isKpi && <Forms.DateInput field="startDate" label={t("Start date")} required />}
              </div>
              <fieldset className="mt-2">
                {peopleReady ? (
                  <div className={`grid gap-4 ${isKpi ? "" : "sm:grid-cols-2"}`}>
                    <div>
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
                    </div>
                    {!isKpi && (
                      <div>
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
                      </div>
                    )}
                  </div>
                ) : (
                  !props.peopleError && (
                    <p role="status" className="text-sm text-content-subtle">
                      {t("Loading...")}
                    </p>
                  )
                )}
              </fieldset>
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

function TemplateCard({ template }: Pick<CuratedTemplateUsePageProps, "template">) {
  const { t } = useTranslation();
  const templateLabel = { project: t("Project template"), goal: t("Goal template"), kpi: t("KPI template") };
  const TemplateIcon = { project: IconProjectPlain, goal: IconGoalPlain, kpi: IconChartColumn }[template.type];

  return (
    <div className="my-6 flex items-start gap-4 rounded-xl border border-surface-outline bg-surface-dimmed p-5">
      <div
        className="shrink-0 rounded-lg border border-surface-outline bg-surface-base p-3 text-content-accent"
        aria-hidden="true"
      >
        <TemplateIcon size={24} className="w-6" />
      </div>
      <div className="min-w-0">
        <div className="text-xs font-semibold text-content-subtle">{templateLabel[template.type]}</div>
        <h2 className="mt-1 break-words text-lg font-bold leading-snug text-content-accent">{template.title}</h2>
        <p className="mt-1 break-words text-sm text-content-subtle">{template.summary}</p>
      </div>
    </div>
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
