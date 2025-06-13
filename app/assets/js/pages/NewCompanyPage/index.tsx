import * as Api from "@/api";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as React from "react";

import { OperatelyLogo } from "@/components/OperatelyLogo";
import { DeprecatedPaths } from "@/routes/paths";
import { useNavigate } from "react-router-dom";

import Forms from "@/components/Forms";
import { PageModule } from "@/routes/types";

export default { name: "NewCompanyPage", loader: Pages.emptyLoader, Page } as PageModule;

function Page() {
  const navigate = useNavigate();
  const [add] = Api.useAddCompany();

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
      });

      navigate(DeprecatedPaths.companyHomePath(res.company.id));
    },
  });

  return (
    <Pages.Page title={"New Company"}>
      <Paper.Root size="small" className="mt-24">
        <Paper.NavigateBack to={DeprecatedPaths.lobbyPath()} title="Back to the Lobby" />
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
