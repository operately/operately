import { loader, useLoadedData } from "./loader";
import * as Companies from "@/models/companies";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as React from "react";
import { Trans, useTranslation } from "react-i18next";

import { OperatelyLogo } from "@/components/OperatelyLogo";
import { Paths } from "@/routes/paths";
import { useNavigate } from "react-router";

import { Forms, Link } from "turboui";
import { translationText } from "@/i18n";
import { PageModule } from "@/routes/types";
import { parseBillingIntent } from "./billingIntent";

export default { name: "NewCompanyPage", loader, Page } as PageModule;

function Page() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { mutateAsync: add } = Companies.useCreateCompany();
  const { billingCatalog } = useLoadedData();
  const billingIntent = React.useMemo(
    () => parseBillingIntent(window.location.search, billingCatalog),
    [billingCatalog],
  );

  const form = Forms.useForm({
    fields: {
      companyName: "",
      title: "",
      isDemo: "false",
    },
    submit: async () => {
      const res = await add({
        companyName: form.values.companyName,
        title: form.values.title,
        isDemo: form.values.isDemo == "true",
        plan: billingIntent.plan,
        billingPeriod: billingIntent.billingPeriod,
      });

      navigate(Paths.companyWorkMapPath(res.company.id));
    },
  });

  return (
    <Pages.Page title={translationText(t("New Company"))}>
      <Paper.Root size="small" className="mt-24">
        <Paper.NavigateBack to={Paths.lobbyPath()} title={t("Back to the Lobby")} />
        <Paper.Body>
          <PageTitle />

          <Forms.Form form={form}>
            <Forms.FieldGroup>
              <Forms.TextInput
                field="companyName"
                label={translationText(t("Name of the company"))}
                placeholder={translationText(t("e.g. Acme Co."))}
                required
                minLength={3}
              />
              <Forms.TextInput
                field="title"
                label={translationText(t("What's your title in the company?"))}
                placeholder={translationText(t("e.g. Founder"))}
              />

              {window.appConfig.demoBuilder && (
                <Forms.RadioButtons
                  field="isDemo"
                  label={translationText(t("Is this a demo company?"))}
                  options={[
                    { label: translationText(t("Yes")), value: "true" },
                    { label: translationText(t("No")), value: "false" },
                  ]}
                />
              )}
            </Forms.FieldGroup>

            <Forms.Submit saveText={translationText(t("Create Company"))} buttonSize="sm" />
          </Forms.Form>

          <div className="mt-4 text-center text-sm text-content-dimmed">
            <Trans
              i18nKey="Do you have an existing company? <actionLink>Import it here</actionLink>"
              components={{
                actionLink: <Link to={Paths.companyImportPath()} underline="hover" />,
              }}
            />
          </div>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function PageTitle() {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between mb-8">
      <div className="">
        <div className="text-content-accent text-xl font-semibold">{t("New Company")}</div>
        <div className="text-content-accent">{t("Let's set up your company in Operately.")}</div>
      </div>
      <OperatelyLogo width="40" height="40" />
    </div>
  );
}
