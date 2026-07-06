import Api from "@/api";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as React from "react";

import { OperatelyLogo } from "@/components/OperatelyLogo";
import { Paths } from "@/routes/paths";
import { useNavigate } from "react-router-dom";

import { Forms, Link } from "turboui";
import { PageModule } from "@/routes/types";
import { BillingCatalog, parseBillingIntent } from "./billingIntent";

export default { name: "NewCompanyPage", loader, Page } as PageModule;

interface LoaderResult {
  billingCatalog: BillingCatalog;
}

async function loader(): Promise<LoaderResult> {
  const result = await Api.billing.getCatalog({});

  return {
    billingCatalog: {
      plans: result.plans ?? [],
      catalogProducts: result.catalogProducts ?? [],
    },
  };
}

function Page() {
  const navigate = useNavigate();
  const [add] = Api.companies.useCreate();
  const { billingCatalog } = Pages.useLoadedData<LoaderResult>();
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

      navigate(Paths.companyHomePath(res.company.id));
    },
  });

  return (
    <Pages.Page title={"New Company"}>
      <Paper.Root size="small" className="mt-24">
        <Paper.NavigateBack to={Paths.lobbyPath()} title="Back to the Lobby" />
        <Paper.Body>
          <PageTitle />

          <Forms.Form form={form}>
            <Forms.FieldGroup>
              <Forms.TextInput field="companyName" label="Name of the company" placeholder="e.g. Acme Co." />
              <Forms.TextInput field="title" label="What's your title in the company?" placeholder="e.g. Founder" />

              {window.appConfig.demoBuilder && (
                <Forms.RadioButtons
                  field="isDemo"
                  label="Is this a demo company?"
                  options={[
                    { label: "Yes", value: "true" },
                    { label: "No", value: "false" },
                  ]}
                />
              )}
            </Forms.FieldGroup>

            <Forms.Submit saveText="Create Company" buttonSize="sm" />
          </Forms.Form>

          <div className="mt-4 text-center text-sm text-content-dimmed">
            Do you have an existing company?{" "}
            <Link to={Paths.companyImportPath()} underline="hover">
              Import it here
            </Link>
          </div>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function PageTitle() {
  return (
    <div className="flex items-center justify-between mb-8">
      <div className="">
        <div className="text-content-accent text-xl font-semibold">New Company</div>
        <div className="text-content-accent">Let&apos;s set up your company in Operately.</div>
      </div>
      <OperatelyLogo width="40" height="40" />
    </div>
  );
}
